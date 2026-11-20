using System.Runtime.InteropServices;
namespace Pianotype;
sealed class KeyboardHook : IDisposable {
 delegate nint Callback(int code,nint message,nint data);
 readonly Callback callback;readonly HashSet<int> down=[];readonly Action strike; nint hook;
 [StructLayout(LayoutKind.Sequential)]struct KeyData { public uint Key,Scan,Flags,Time;public nuint Extra; }
 [DllImport("user32.dll",SetLastError=true)]static extern nint SetWindowsHookEx(int id,Callback proc,nint module,uint thread);
 [DllImport("user32.dll")]static extern bool UnhookWindowsHookEx(nint hook);
 [DllImport("user32.dll")]static extern nint CallNextHookEx(nint hook,int code,nint message,nint data);
 [DllImport("user32.dll")]static extern short GetAsyncKeyState(int key);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode)]static extern nint GetModuleHandle(string? name);
 public KeyboardHook(Action strike){this.strike=strike;callback=Handle;hook=SetWindowsHookEx(13,callback,GetModuleHandle(null),0);if(hook==0)throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(),"키보드 감지를 시작하지 못했어요.");}
 nint Handle(int code,nint message,nint pointer){
  if(code>=0){var data=Marshal.PtrToStructure<KeyData>(pointer);int key=(int)data.Key;int msg=(int)message;
   if(msg is 0x101 or 0x105)down.Remove(key);
   else if(msg is 0x100 or 0x104){bool repeat=!down.Add(key),modifier=new[]{0x11,0x12,0x5B,0x5C}.Any(k=>(GetAsyncKeyState(k)&0x8000)!=0);
    if(TypingKeys.Accepts(key,repeat,modifier,(data.Flags&0x10)!=0)){try{strike();}catch(InvalidOperationException){}}
   }
  }
  return CallNextHookEx(hook,code,message,pointer);
 }
 public void Dispose(){if(hook!=0){UnhookWindowsHookEx(hook);hook=0;}GC.KeepAlive(callback);}
}
