using NAudio.Wave;
using NAudio.CoreAudioApi;
using System.Reflection;
namespace Pianotype;
static class Assets {
 public static Stream Open(string name) => Assembly.GetExecutingAssembly().GetManifestResourceStream("Pianotype.Assets."+name) ?? throw new FileNotFoundException(name);
 public static string Text(string name) { using var reader=new StreamReader(Open(name));return reader.ReadToEnd(); }
 public static string Cache(string name) {
  string path=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Pianotype","audio-1.2",name);Directory.CreateDirectory(Path.GetDirectoryName(path)!);
  using var source=Open(name);using var file=File.Create(path);source.CopyTo(file);return path;
 }
}
sealed class AudioEngine : ISampleProvider, IDisposable {
 sealed class Voice(float[] samples,double rate,double release,double fade,double gain,int midi){public float[] Samples=samples; public double Position; public double Rate=rate;public int Age;public double Release=release;public double Fade=fade;public double Gain=gain;public int Midi=midi;}
 readonly Dictionary<int,float[]> samples=[];readonly List<Voice> voices=[];readonly object gate=new();readonly IWavePlayer? output;
 readonly MMDevice? outputDevice;
 public WaveFormat WaveFormat {get;}=WaveFormat.CreateIeeeFloatWaveFormat(44100,2);
 public float Volume=.7f;
 internal AudioEngine(Dictionary<int,float[]> buffers){foreach(var pair in buffers)samples.Add(pair.Key,pair.Value);}
 public AudioEngine(){
  string[] names=["C","Ds","Fs","A"];
  for(int octave=2;octave<=6;octave++)for(int i=0;i<4;i++){
   if(octave==6&&i>0)continue;
   using var reader=new WaveFileReader(Assets.Cache($"{names[i]}{octave}.wav"));
   ISampleProvider input=reader.ToSampleProvider();
   if(input.WaveFormat.SampleRate!=44100)input=new NAudio.Wave.SampleProviders.WdlResamplingSampleProvider(input,44100);
   if(input.WaveFormat.Channels==1)input=new NAudio.Wave.SampleProviders.MonoToStereoSampleProvider(input);
   if(input.WaveFormat.Channels!=2)throw new InvalidDataException("지원하지 않는 음원 채널이에요.");
   var data=new List<float>();float[] buffer=new float[8192];int read;while((read=input.Read(buffer,0,buffer.Length))>0)data.AddRange(buffer.AsSpan(0,read).ToArray());samples[(octave+1)*12+i*3]=data.ToArray();
  }
  using var devices = new MMDeviceEnumerator();
  outputDevice = devices.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
  output = new WasapiOut(outputDevice, AudioClientShareMode.Shared, true, 50);
  // Match the device rate before WASAPI initialization. Its automatic conversion
  // corrupts the continuous mixer stream on 48 kHz Windows output devices.
  ISampleProvider playback = this;
  int deviceRate = outputDevice.AudioClient.MixFormat.SampleRate;
  if (deviceRate != WaveFormat.SampleRate)
   playback = new NAudio.Wave.SampleProviders.WdlResamplingSampleProvider(playback, deviceRate);
  try { output.Init(playback); output.Play(); }
  catch { output.Dispose(); outputDevice.Dispose(); throw; }
 }
 public void Play(ScoreEvent score,bool sustain,double scale=1){lock(gate){foreach(var note in score.Notes){int nearest=samples.Keys.MinBy(k=>Math.Abs(k-note.Midi));
  // Release the previous strike of the same key instead of cutting its tail.
  foreach(var old in voices.Where(v=>v.Midi==note.Midi)){old.Release=Math.Min(old.Release,old.Age/44100.0);old.Fade=.06;}
  if(voices.Count>=64)voices.RemoveAt(0);
  double duration=sustain?Math.Max(.55,Math.Clamp(note.Duration*scale,.14,1.2)):Math.Clamp(note.Duration,.08,8);
  voices.Add(new(samples[nearest],Math.Pow(2,(note.Midi-nearest)/12.0),duration,sustain?.45:.17,note.Velocity*.5/Math.Sqrt(score.Notes.Length),note.Midi));
 }}}
 public void Hush(){lock(gate){foreach(var v in voices){v.Release=Math.Min(v.Release,v.Age/44100.0);v.Fade=.1;}}}
 public int Read(float[] buffer,int offset,int count){Array.Clear(buffer,offset,count);lock(gate){
  for(int j=voices.Count-1;j>=0;j--){var v=voices[j];bool done=false;
   for(int n=0;n<count-1;n+=2){int frame=(int)v.Position,idx=frame*2;double time=v.Age/44100.0;if(idx+3>=v.Samples.Length||time>=v.Release+v.Fade){done=true;break;}
    double fade=time<=v.Release?1:Math.Max(0,1-(time-v.Release)/v.Fade),fraction=v.Position-frame,gain=v.Gain*fade*Volume;
    for(int ch=0;ch<2;ch++)buffer[offset+n+ch]+=(float)((v.Samples[idx+ch]*(1-fraction)+v.Samples[idx+2+ch]*fraction)*gain);
    v.Position+=v.Rate;v.Age++;
   }if(done)voices.RemoveAt(j);
  }
  for(int n=offset;n<offset+count;n++)buffer[n]=Math.Clamp(buffer[n],-.98f,.98f);
 }return count;}
 public void Dispose(){output?.Stop();output?.Dispose();outputDevice?.Dispose();}
}
