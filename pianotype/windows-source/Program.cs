using System.Diagnostics;
using System.Drawing.Drawing2D;
using System.Text.Json;
namespace Pianotype;
static class Program {
 [STAThread] static void Main(){
  using var mutex=new Mutex(true,"Local\\Pianotype.Windows",out bool first);
  if(!first){MessageBox.Show("Pianotype이 이미 실행 중이에요. 작업 표시줄 오른쪽의 피아노 아이콘을 눌러주세요.","Pianotype");return;}
  ApplicationConfiguration.Initialize();
  try{Application.Run(new MainWindow());}catch(Exception ex){MessageBox.Show("Pianotype을 시작하지 못했어요.\n"+ex.Message,"Pianotype",MessageBoxButtons.OK,MessageBoxIcon.Error);}
 }
}
sealed class Preferences {
 public bool Floating {get;set;}
 public float Volume {get;set;}=.7f;
 public string Song {get;set;}="월광 소나타 — 3악장";
 static string FilePath=>Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Pianotype","settings.json");
 public static Preferences Load(){try{return JsonSerializer.Deserialize<Preferences>(File.ReadAllText(FilePath))??new();}catch{return new();}}
 public void Save(){try{Directory.CreateDirectory(Path.GetDirectoryName(FilePath)!);File.WriteAllText(FilePath,JsonSerializer.Serialize(this));}catch(IOException){}catch(UnauthorizedAccessException){}}
}
sealed class MainWindow:Form {
 readonly Preferences settings=Preferences.Load();readonly List<Song> songs;
 readonly AudioEngine audio;readonly KeyboardHook hook;readonly Cursor cursor=new();
 readonly ComboBox selector=new();readonly TrackBar timeline=new(),volume=new();readonly Label elapsed=new(),total=new();
 readonly Button preview=new(),listen=new(),piano=new();readonly ToolTip tips=new(){InitialDelay=150,ReshowDelay=100};
 readonly System.Windows.Forms.Timer timer=new(){Interval=16};readonly NotifyIcon tray;readonly FloatingPiano floating;
 readonly Stopwatch clock=Stopwatch.StartNew();double previewAnchor,previewStart,lastStrike=-10;int previewIndex;bool previewing,listening=true,seeking;double position;
 Song Current=>songs[selector.SelectedIndex];
 static readonly Color Ink=Color.FromArgb(58,66,52),Green=Color.FromArgb(82,103,63),Paper=Color.FromArgb(248,247,240);
 public MainWindow(){
  Text="Pianotype";Font=new Font("Malgun Gothic",10);ForeColor=Ink;BackColor=Paper;ClientSize=new Size(560,204);FormBorderStyle=FormBorderStyle.FixedSingle;MaximizeBox=false;StartPosition=FormStartPosition.CenterScreen;AutoScaleDimensions=new SizeF(96,96);AutoScaleMode=AutoScaleMode.Dpi;
  using(var icon=Assets.Open("Pianotype.ico"))Icon=new Icon(icon);
  songs=Song.Load(Assets.Text("songs.json")).ToList();audio=new AudioEngine{Volume=Math.Clamp(settings.Volume,0,1)};floating=new FloatingPiano{Icon=Icon};
  selector.SetBounds(24,23,462,34);selector.DropDownStyle=ComboBoxStyle.DropDownList;selector.DrawMode=DrawMode.OwnerDrawFixed;selector.ItemHeight=27;selector.AccessibleName="곡 선택";selector.Items.AddRange(songs.Cast<object>().ToArray());selector.DrawItem+=DrawSong;Controls.Add(selector);
  Button add=ButtonAt("+",496,22,40,36,Import);tips.SetToolTip(add,"MIDI 파일 추가");add.AccessibleName="MIDI 파일 추가";
  preview=ButtonAt("▶",24,79,32,32,TogglePreview);tips.SetToolTip(preview,"곡 미리듣기 / 일시정지");preview.AccessibleName="곡 미리듣기";
  Button reset=ButtonAt("↺",60,79,32,32,()=>Seek(0));tips.SetToolTip(reset,"처음부터");reset.AccessibleName="처음부터";
  elapsed.SetBounds(100,84,43,25);elapsed.Text="0:00";Controls.Add(elapsed);
  timeline.SetBounds(145,79,335,32);timeline.TickStyle=TickStyle.None;timeline.Maximum=10000;timeline.AutoSize=false;timeline.AccessibleName="곡 위치";timeline.MouseDown+=(_,_)=>{seeking=true;StopPreview();};timeline.MouseUp+=(_,_)=>{Seek(timeline.Value/10000.0*Current.Duration);seeking=false;};timeline.KeyUp+=(_,e)=>{if(e.KeyCode is Keys.Left or Keys.Right or Keys.Home or Keys.End or Keys.PageUp or Keys.PageDown)Seek(timeline.Value/10000.0*Current.Duration);};Controls.Add(timeline);
  total.SetBounds(490,84,46,25);total.TextAlign=ContentAlignment.MiddleRight;Controls.Add(total);
  var line=new Panel{BackColor=Color.FromArgb(218,218,208)};line.SetBounds(24,127,512,1);Controls.Add(line);
  var volLabel=new Label{Text="음량",AutoSize=true};volLabel.Location=new Point(24,155);Controls.Add(volLabel);
  volume.SetBounds(70,148,152,35);volume.TickStyle=TickStyle.None;volume.Maximum=100;volume.Value=(int)(audio.Volume*100);volume.AccessibleName="음량";volume.ValueChanged+=(_,_)=>{audio.Volume=volume.Value/100f;settings.Volume=audio.Volume;};volume.MouseUp+=(_,_)=>settings.Save();Controls.Add(volume);
  piano=ButtonAt("▥",300,146,42,36,()=>SetFloating(!settings.Floating));piano.AccessibleName="화면에 피아노 건반 표시";tips.SetToolTip(piano,"화면에 피아노 건반 표시 / 숨기기");
  var minimize=ButtonAt("—",348,146,38,36,()=>WindowState=FormWindowState.Minimized);tips.SetToolTip(minimize,"창 최소화");minimize.AccessibleName="창 최소화";
  listen=ButtonAt("연주 끄기",400,146,136,36,()=>SetListening(!listening));listen.BackColor=Green;listen.ForeColor=Color.White;listen.AccessibleName="타이핑 연주 켜기 / 끄기";
  selector.SelectedIndexChanged+=(_,_)=>{StopPreview();Seek(0);settings.Song=Current.Title;settings.Save();};selector.SelectedIndex=Math.Max(0,songs.FindIndex(s=>s.Title==settings.Song));
  tray=new NotifyIcon{Icon=Icon,Text="Pianotype",Visible=true};var menu=new ContextMenuStrip();menu.Items.Add("Pianotype 열기",null,(_,_)=>Restore());menu.Items.Add("연주 켜기 / 끄기",null,(_,_)=>SetListening(!listening));menu.Items.Add("건반 표시 / 숨기기",null,(_,_)=>SetFloating(!settings.Floating));menu.Items.Add("종료",null,(_,_)=>Close());tray.ContextMenuStrip=menu;tray.DoubleClick+=(_,_)=>Restore();
  // Create the HWND before installing the hook; callback does only a UI queue post.
  _=Handle;hook=new KeyboardHook(()=>{if(!IsDisposed)BeginInvoke((Action)Strike);});
  timer.Tick+=(_,_)=>Tick();timer.Start();Shown+=(_,_)=>SetFloating(settings.Floating);
  FormClosing+=(_,_)=>{settings.Save();timer.Stop();hook.Dispose();tray.Dispose();floating.Dispose();audio.Dispose();tips.Dispose();};
 }
 Button ButtonAt(string text,int x,int y,int w,int h,Action action){var b=new Button{Text=text,FlatStyle=FlatStyle.Flat,BackColor=Color.White,ForeColor=Ink,Cursor=Cursors.Hand,TabStop=true};b.FlatAppearance.BorderColor=Color.FromArgb(220,220,210);b.SetBounds(x,y,w,h);b.Click+=(_,_)=>action();Controls.Add(b);return b;}
 void DrawSong(object? sender,DrawItemEventArgs e){if(e.Index<0)return;e.DrawBackground();var s=songs[e.Index];var foreground=(e.State&DrawItemState.Selected)!=0?SystemColors.HighlightText:Ink;TextRenderer.DrawText(e.Graphics,s.Title,Font,new Rectangle(e.Bounds.X+8,e.Bounds.Y,e.Bounds.Width-95,e.Bounds.Height),foreground,TextFormatFlags.VerticalCenter|TextFormatFlags.EndEllipsis);TextRenderer.DrawText(e.Graphics,s.Speed,Font,new Rectangle(e.Bounds.Right-84,e.Bounds.Y,76,e.Bounds.Height),(e.State&DrawItemState.Selected)!=0?foreground:Color.Gray,TextFormatFlags.Right|TextFormatFlags.VerticalCenter);e.DrawFocusRectangle();}
 void Restore(){Show();WindowState=FormWindowState.Normal;Activate();}
 void SetListening(bool enabled){listening=enabled;if(!enabled){StopPreview();audio.Hush();floating.Keys=[];floating.Invalidate();}listen.Text=enabled?"연주 끄기":"연주 켜기";listen.BackColor=enabled?Green:Color.White;listen.ForeColor=enabled?Color.White:Ink;tray.Text=enabled?"Pianotype · 연주 켜짐":"Pianotype · 연주 꺼짐";}
 void SetFloating(bool enabled){settings.Floating=enabled;settings.Save();piano.BackColor=enabled?Color.FromArgb(222,232,210):Color.White;if(enabled){if(!floating.Visible)floating.Show();}else floating.Hide();}
 void Strike(){if(!listening||previewing)return;double now=clock.Elapsed.TotalSeconds;var e=cursor.Strike(Current);int index=cursor.Index-1;double scoreGap=index+1<Current.Events.Length?Current.Events[index+1].Time-e.Time:.4;double actual=lastStrike<0?.18:Math.Clamp(now-lastStrike,.04,.6);audio.Play(e,true,Math.Clamp(actual/Math.Max(.025,scoreGap),.2,3));position=cursor.Index==Current.Events.Length?Current.Duration:e.Time;Highlight(e);lastStrike=now;UpdateTimeline();}
 void Highlight(ScoreEvent e){floating.Keys=e.Notes.Select(n=>n.Midi).ToHashSet();floating.Invalidate();lastStrike=clock.Elapsed.TotalSeconds;}
 void TogglePreview(){if(previewing){StopPreview();return;}if(position>=Current.Duration)Seek(0);previewStart=position;previewAnchor=clock.Elapsed.TotalSeconds;previewIndex=Array.FindIndex(Current.Events,e=>e.Time>=position);if(previewIndex<0)previewIndex=Current.Events.Length;previewing=true;preview.Text="Ⅱ";audio.Hush();}
 void StopPreview(){if(!previewing)return;previewing=false;preview.Text="▶";cursor.Seek(Current,position);audio.Hush();}
 void Seek(double value){StopPreview();position=Math.Clamp(value,0,Current.Duration);cursor.Seek(Current,position);audio.Hush();floating.Keys=[];floating.Invalidate();lastStrike=-10;UpdateTimeline();}
 void Tick(){if(previewing){position=Math.Min(Current.Duration,previewStart+clock.Elapsed.TotalSeconds-previewAnchor);while(previewIndex<Current.Events.Length&&Current.Events[previewIndex].Time<=position){var e=Current.Events[previewIndex++];audio.Play(e,false);Highlight(e);}if(position>=Current.Duration)StopPreview();UpdateTimeline();}if(clock.Elapsed.TotalSeconds-lastStrike>.18&&floating.Keys.Count>0){floating.Keys=[];floating.Invalidate();}}
 void UpdateTimeline(){if(!seeking)timeline.Value=Math.Clamp((int)(position/Current.Duration*10000),0,10000);elapsed.Text=Time(position);total.Text=Time(Current.Duration);}
 static string Time(double seconds)=>$"{(int)seconds/60}:{(int)seconds%60:00}";
 void Import(){using var dialog=new OpenFileDialog{Filter="MIDI 파일 (*.mid;*.midi)|*.mid;*.midi",Title="MIDI 파일 추가"};if(dialog.ShowDialog(this)!=DialogResult.OK)return;try{var info=new FileInfo(dialog.FileName);if(info.Length>16*1024*1024)throw new InvalidDataException("16 MB 이하의 MIDI를 선택해주세요.");var song=MidiReader.Parse(File.ReadAllBytes(dialog.FileName),Path.GetFileNameWithoutExtension(dialog.FileName));songs.Add(song);selector.Items.Add(song);selector.SelectedIndex=songs.Count-1;}catch(Exception ex){MessageBox.Show(this,"MIDI를 불러오지 못했어요.\n"+ex.Message,"Pianotype",MessageBoxButtons.OK,MessageBoxIcon.Information);}}
}
sealed class FloatingPiano:Form {
 public HashSet<int> Keys=[];
 public FloatingPiano(){FormBorderStyle=FormBorderStyle.None;ShowInTaskbar=false;TopMost=true;BackColor=Color.FromArgb(248,247,240);DoubleBuffered=true;AutoScaleDimensions=new SizeF(96,96);AutoScaleMode=AutoScaleMode.Dpi;ClientSize=new Size(800,100);StartPosition=FormStartPosition.Manual;var area=Screen.PrimaryScreen!.WorkingArea;Location=new Point(area.Left+(area.Width-Width)/2,area.Bottom-Height-18);}
 protected override bool ShowWithoutActivation=>true;
 protected override CreateParams CreateParams{get{var cp=base.CreateParams;cp.ExStyle|=0x08000000|0x80;return cp;}}
 protected override void WndProc(ref Message m){if(m.Msg==0x84){m.Result=(nint)2;return;}base.WndProc(ref m);}
 protected override void OnPaint(PaintEventArgs e){base.OnPaint(e);var g=e.Graphics;g.SmoothingMode=SmoothingMode.AntiAlias;float pad=10,w=(ClientSize.Width-2*pad)/52f,h=ClientSize.Height-2*pad;int white=0;
  using var outline=new Pen(Color.FromArgb(212,212,204));using var dark=new SolidBrush(Color.FromArgb(58,66,52));using var lit=new SolidBrush(Color.FromArgb(177,202,140));
  bool Black(int n)=>n%12 is 1 or 3 or 6 or 8 or 10;
  for(int n=21;n<=108;n++){if(Black(n))continue;var rect=new RectangleF(pad+white*w,pad,w-1,h);g.FillRectangle(Keys.Contains(n)?lit:Brushes.White,rect);g.DrawRectangle(outline,rect.X,rect.Y,rect.Width,rect.Height);white++;}
  white=0;for(int n=21;n<=108;n++){if(!Black(n)){white++;continue;}var rect=new RectangleF(pad+white*w-w*.32f,pad,w*.6f,h*.62f);g.FillRectangle(Keys.Contains(n)?lit:dark,rect);}
 }
}
