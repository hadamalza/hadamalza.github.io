# Pianotype Windows 오디오 문제 인계

사용자는 Windows에서 Pianotype 1.2와 1.2.1을 실행했고, **타이핑 연주와 ▶ 곡 미리듣기 양쪽 모두 피아노 소리 대신 “드드드드득” 기계음이 난다**고 확인했다. 1.2.1에서도 재현된다. Windows 실기기에서 직접 오디오를 녹음·분석하고 수정해야 한다. Mac에서 빌드한 뒤 테스트만 통과시켜 재배포하는 방식으로는 해결되지 않았다.

- 배포 페이지: https://hadamalza.github.io/pianotype/
- 수정 가능한 Windows 소스: https://github.com/hadamalza/hadamalza.github.io/tree/main/pianotype/windows-source
- 프로젝트 파일: `pianotype/windows-source/Pianotype.csproj`
- 오디오 구현: `pianotype/windows-source/Audio.cs`
- UI·곡 미리듣기·종료 동작: `pianotype/windows-source/Program.cs`
- 키 감지: `pianotype/windows-source/KeyboardHook.cs`
- 곡 데이터와 샘플: `pianotype/windows-source/Assets/`
- 자동 검사: `pianotype/windows-source/Tests/`

## 지금까지 한 일

1.2에서는 NAudio `WaveOutEvent`를 45 ms / 3버퍼로 쓰고, MP3를 시작할 때 해독했다. 너무 짧은 15 ms 버퍼로 인한 끊김을 의심했다. 1.2.1에서는 샘플을 사전에 44.1 kHz 16-bit stereo WAV로 변환하고, `WasapiOut(AudioClientShareMode.Shared, true, 50)`으로 바꿨다. **그래도 사용자 Windows에서 같은 증상이다.** 따라서 단순 MP3 해독이나 WaveOut 버퍼 문제라고 단정하면 안 된다.

또 1.2는 X로 창을 닫아도 트레이에서 계속 실행돼 소리가 남았다. 1.2.1은 X가 완전 종료하도록 변경했다. 구버전은 트레이 아이콘을 우클릭해 종료해야 한다.

## Windows에서 다음으로 할 일

1. 이전 Pianotype 프로세스를 트레이나 작업 관리자에서 완전히 종료하고, 저장소를 Windows에 클론한다.
2. .NET 10 SDK가 있으면 `dotnet run --project pianotype/windows-source/Tests/Tests.csproj`, `dotnet run --project pianotype/windows-source/Pianotype.csproj`로 실행한다. 실행 인자는 필수 아님.
3. ▶ 미리듣기를 눌러 증상을 재현한다. 실제 출력(가능하면 WASAPI loopback)을 녹음하고, `Assets/C4.wav` 파일을 별도 플레이어에서 재생해 원본과 비교한다.
4. `AudioEngine.Read`가 오디오 장치에 전달하는 PCM에서 피크, RMS, 반복 패턴, NaN/Infinity를 검사한다. 잘못된 샘플 생성인지 출력 장치 설정인지 분리한다. 필요하면 440 Hz 정현파를 엔진 대신 내보내 WASAPI 출력만 단독 검증한다.
5. 원인을 고친 뒤 **실제 Windows에서** 타건, 미리듣기, X 종료를 듣고 확인한다. 새 버전으로 빌드·압축해 `pianotype/downloads/`와 배포 페이지를 업데이트한다.

## 현재 자동 검증의 한계

Mac에서 Windows x64 실행 파일을 크로스 빌드했다. 11곡 JSON, MIDI 템포·running status, 키 필터, WAV에 비영(非零) 오디오 데이터가 있다는 점, 서스테인/정지 관련 단위 검사는 통과했다. **Windows 오디오 장치를 통한 실제 소리는 검증하지 못했다.** 이 문제를 고치려면 Windows 실기기에서 디버깅해야 한다.

### 동작 의도

어느 앱에서든 글자 키 한 번마다 악보의 다음 음표 또는 화음이 울린다. 스페이스·엔터·편집키·단축키·키 반복은 제외한다. 11곡, MIDI 추가, 미리듣기, 서스테인, 플로팅 건반이 있다. Windows에서는 X로 앱이 완전히 종료된다.
