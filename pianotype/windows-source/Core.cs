using System.Text.Json;
namespace Pianotype;
public record Note(int Midi, double Duration, double Velocity);
public record ScoreEvent(double Time, Note[] Notes);
public record Song(string Title, ScoreEvent[] Events, double Duration) {
 public string Speed => (Events.Length / Duration) switch { < 2 => "느림", < 5 => "보통", < 9 => "빠름", _ => "매우 빠름" };
 public override string ToString() => Title;
 public static Song[] Load(string json) {
  var songs = JsonSerializer.Deserialize<Song[]>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];
  if (songs.Length == 0 || songs.Any(s => string.IsNullOrWhiteSpace(s.Title) || !double.IsFinite(s.Duration) || s.Duration <= 0 || s.Events is not { Length: > 0 } || s.Events.Any(e => !double.IsFinite(e.Time) || e.Time < 0 || e.Notes is not { Length: > 0 } || e.Notes.Any(n => n.Midi is < 0 or > 127 || !double.IsFinite(n.Duration) || n.Duration <= 0 || !double.IsFinite(n.Velocity) || n.Velocity is < 0 or > 1)) || s.Events.Zip(s.Events.Skip(1)).Any(pair => pair.First.Time > pair.Second.Time))) throw new InvalidDataException("곡 데이터를 읽을 수 없어요.");
  return songs;
 }
}
public class Cursor {
 public int Index { get; private set; }
 public void Seek(Song song, double time) { Index = Array.FindIndex(song.Events, e => e.Time >= time); if (Index < 0) Index = song.Events.Length; }
 public ScoreEvent Strike(Song song) { if (Index >= song.Events.Length) Index = 0; return song.Events[Index++]; }
}
public static class TypingKeys {
 public static bool Accepts(int key, bool repeat, bool modifier, bool injected) => !repeat && !modifier && !injected && (key is >= 0x30 and <= 0x5A || key is >= 0x60 and <= 0x6F || key is >= 0xBA and <= 0xC0 || key is >= 0xDB and <= 0xDF || key == 0xE2) && !(key is >= 0x3A and <= 0x40);
}
// MIDI format 0/1, merged tempo map, running status; percussion excluded.
public static class MidiReader {
 sealed class Reader(byte[] data) {
  public int P;
  public int End = data.Length;
  public int Number(int n) { if (n < 0 || P > End-n) throw new InvalidDataException("잘린 MIDI 파일이에요."); int v=0; for(int i=0;i<n;i++) v=checked((v<<8)|data[P++]); return v; }
  public void Skip(int n) { if (n<0 || P>End-n) throw new InvalidDataException(); P+=n; }
  public int Variable() { int n=0; for(int i=0;i<4;i++){int b=Number(1);n=(n<<7)|(b&127);if((b&128)==0)return n;}throw new InvalidDataException(); }
 }
 record Raw(int Tick,int End,int Midi,double Velocity);
 public static Song Parse(byte[] data,string title) {
  if(data.Length>16*1024*1024)throw new InvalidDataException("16 MB 이하의 MIDI를 선택해주세요.");
  var r=new Reader(data);if(r.Number(4)!=0x4D546864)throw new InvalidDataException("MIDI 파일을 선택해주세요.");
  int len=r.Number(4);if(len<6)throw new InvalidDataException();int format=r.Number(2),tracks=r.Number(2),division=r.Number(2);
  if(format>1 || tracks is <1 or >256 || division<=0 || (division&0x8000)!=0)throw new InvalidDataException("표준 MIDI 형식 0/1을 사용해주세요.");r.Skip(len-6);
  var notes=new List<Raw>();var tempos=new List<(int Tick,int Value,int Order)>{(0,500000,0)};
  for(int track=0;track<tracks;track++){
   if(r.Number(4)!=0x4D54726B)throw new InvalidDataException();int size=r.Number(4),stop=checked(r.P+size);if(size<0||stop>data.Length)throw new InvalidDataException();r.End=stop;
   int tick=0,running=0;var active=new Dictionary<int,(int Tick,int Midi,double Velocity)>();
   while(r.P<stop){tick=checked(tick+r.Variable());int status=r.Number(1);if(status<128){if(running==0)throw new InvalidDataException();r.P--;status=running;}
    if(status==255){int type=r.Number(1),count=r.Variable();if(type==81&&count==3){int tempo=r.Number(3);if(tempo<=0)throw new InvalidDataException();tempos.Add((tick,tempo,tempos.Count));}else r.Skip(count);running=0;}
    else if(status is 240 or 247){r.Skip(r.Variable());running=0;}
    else if(status is >=128 and <240){running=status;int type=status>>4,channel=status&15,a=r.Number(1),b=type is 12 or 13?0:r.Number(1);if(a>127||b>127)throw new InvalidDataException();if(channel==9)continue;int key=channel*128+a;
     if(type==9&&b>0){if(active.TryGetValue(key,out var old))notes.Add(new(old.Tick,tick,a,old.Velocity));active[key]=(tick,a,b/127.0);}
     else if(type==8 || type==9&&b==0){if(active.Remove(key,out var old))notes.Add(new(old.Tick,tick,a,old.Velocity));}
    }else throw new InvalidDataException();if(notes.Count>200000||tempos.Count>200000)throw new InvalidDataException("MIDI 파일이 너무 커요.");
   }
   foreach(var n in active.Values)notes.Add(new(n.Tick,checked(tick+division),n.Midi,n.Velocity));r.End=data.Length;
  }
  if(notes.Count==0)throw new InvalidDataException("연주할 음표가 없어요.");
  var timeline=new List<(int Tick,double Seconds,int Tempo)>();int prev=0,lastTempo=500000;double seconds=0;
  foreach(var t in tempos.OrderBy(t=>t.Tick).ThenBy(t=>t.Order)){seconds+=(t.Tick-prev)*(double)lastTempo/1e6/division;timeline.Add((t.Tick,seconds,t.Value));prev=t.Tick;lastTempo=t.Value;}
  double Sec(int tick){int lo=0,hi=timeline.Count;while(lo+1<hi){int mid=(lo+hi)/2;if(timeline[mid].Tick<=tick)lo=mid;else hi=mid;}var t=timeline[lo];return t.Seconds+(tick-t.Tick)*(double)t.Tempo/1e6/division;}
  notes=notes.OrderBy(n=>n.Tick).ToList();double origin=Sec(notes[0].Tick),duration=0;var events=new List<ScoreEvent>();
  foreach(var n in notes){double time=Sec(n.Tick)-origin,d=Math.Max(.05,Sec(n.End)-Sec(n.Tick));if(time+d>7200)throw new InvalidDataException("2시간 이내의 곡을 사용해주세요.");duration=Math.Max(duration,time+d);var note=new Note(n.Midi,Math.Min(d,8),n.Velocity*.8);if(events.Count>0 && time-events[^1].Time<.012)events[^1]=events[^1] with { Notes=[..events[^1].Notes,note] };else events.Add(new(time,[note]));}
  return new(title,events.ToArray(),duration);
 }
}
