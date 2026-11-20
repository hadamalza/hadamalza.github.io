using NAudio.Wave;
using Pianotype;
void Check(bool ok,string message){if(!ok)throw new Exception(message);Console.WriteLine("PASS "+message);}
var root=Path.GetFullPath(Path.Combine(AppContext.BaseDirectory,"../../../../"));
var songs=Song.Load(File.ReadAllText(Path.Combine(root,"Assets/songs.json")));Check(songs.Length==11,"All 11 bundled songs validate");
var song=new Song("test",[new(0,[new(60,.1,.8)]),new(.5,[new(64,.2,.8),new(67,.2,.8)]),new(1,[new(72,.2,.8)])],1.2);var cursor=new Cursor();
Check(cursor.Strike(song).Notes[0].Midi==60,"First keystroke starts first event");Check(cursor.Strike(song).Notes.Length==2,"Chord consumes one keystroke");cursor.Strike(song);Check(cursor.Strike(song).Time==0,"Finished song wraps");cursor.Seek(song,.3);Check(cursor.Strike(song).Time==.5,"Seek chooses next event");
Check(new[]{0x20,0x0D,0x09,0x08,0x2E,0x25,0x70}.All(k=>!TypingKeys.Accepts(k,false,false,false)),"Space, enter, edit and function keys excluded");
Check(TypingKeys.Accepts(0x41,false,false,false)&&TypingKeys.Accepts(0xBA,false,false,false),"Letters and punctuation accepted");Check(!TypingKeys.Accepts(0x41,true,false,false)&&!TypingKeys.Accepts(0x41,false,true,false)&&!TypingKeys.Accepts(0x41,false,false,true),"Repeat, shortcuts and injected input excluded");
// Format 1: a tempo track and running-status note track. Tempo change at beat 1.
byte[] header=[0x4d,0x54,0x68,0x64,0,0,0,6,0,1,0,2,1,0xe0];
byte[] tempo=[0,0xff,0x51,3,7,0xa1,0x20,0x83,0x60,0xff,0x51,3,0x0f,0x42,0x40,0,0xff,0x2f,0];
byte[] track=[0,0x90,60,100,0x83,0x60,60,0,0,64,100,0x83,0x60,64,0,0,0xff,0x2f,0];
byte[] Chunk(byte[] b)=>[0x4d,0x54,0x72,0x6b,0,0,0,(byte)b.Length,..b];
var midi=MidiReader.Parse([..header,..Chunk(tempo),..Chunk(track)],"test");Check(midi.Events.Length==2&&Math.Abs(midi.Duration-1.5)<.001,"MIDI running status and cross-track tempo changes");Check(Math.Abs(midi.Events[1].Time-.5)<.001,"MIDI event timing");
try{MidiReader.Parse([..header,..Chunk(tempo),0,1],"bad");throw new Exception("Truncated MIDI accepted");}catch(InvalidDataException){Console.WriteLine("PASS Truncated MIDI rejected");}
using(var reader=new WaveFileReader(Path.Combine(root,"Assets/C4.wav"))){var pcm=reader.ToSampleProvider();float[] chunk=new float[44100];int count=pcm.Read(chunk,0,chunk.Length);Check(reader.WaveFormat.SampleRate==44100&&reader.WaveFormat.Channels==2&&count>0&&chunk.Take(count).Any(x=>Math.Abs(x)>.001f),"Bundled piano WAV decodes to audible stereo samples");}
using var audio=new AudioEngine(new(){[60]=Enumerable.Repeat(.2f,44100*2*3).ToArray()});audio.Play(new(0,[new(60,.1,1)]),true);var output=new float[44100*2];audio.Read(output,0,output.Length);Check(output[44100]>.01&&Math.Abs(output[^1])<.0001,"Sustain holds 0.55s and fades to silence at 1s");audio.Play(new(0,[new(60,1,1)]),true);audio.Hush();audio.Read(output,0,output.Length);Check(Math.Abs(output[10000])<.0001,"Stop releases sustained notes");
foreach(var s in songs){var c=new Cursor();for(int i=0;i<s.Events.Length;i++)CheckSilent(c.Strike(s)==s.Events[i]);}Console.WriteLine("PASS Complete cursor traversal for every song");
void CheckSilent(bool value){if(!value)throw new Exception("Song traversal mismatch");}
