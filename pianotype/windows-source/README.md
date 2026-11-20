# Pianotype for Windows

Windows 10/11 x64용 독립 실행 앱입니다. ZIP을 **모두 압축 풀기** 한 다음 `Pianotype.exe`를 실행하세요. .NET을 따로 설치할 필요가 없습니다.

- 다른 앱에서 문자 키를 누를 때마다 다음 음표/화음을 연주합니다.
- 스페이스, 엔터, 편집·이동 키, Ctrl/Alt/Windows 단축키, 반복 입력과 자동 생성 입력은 제외합니다.
- 11곡, MIDI 가져오기, 곡 미리듣기, 탐색, 음량, 서스테인을 지원합니다.
- 건반 버튼은 독립 플로팅 건반을 표시합니다. 드래그해 옮길 수 있고, 표시 여부를 기억합니다.
- 창을 최소화해도 연주합니다. X를 누르면 앱이 완전히 종료됩니다. 최소화한 창은 작업 표시줄 오른쪽의 Pianotype 아이콘에서 다시 열 수 있습니다.
- 입력 문자와 문서 내용을 읽거나 저장하지 않습니다. 네트워크 통신, 자동 시작, 관리자 권한 요청은 없습니다.
- 관리자 권한 앱, 로그인/잠금 화면, 보안 데스크톱에서는 입력 감지가 제한될 수 있습니다.
- 설정과 WAV 음원 캐시는 `%LOCALAPPDATA%\Pianotype`에 저장됩니다. 가져온 MIDI는 실행 중에만 유지됩니다.

서명하지 않은 개인 배포 앱입니다. SmartScreen이 표시되면 다운로드 출처를 확인하세요.

## 검증 범위

1.2.2는 Windows에서 빌드했습니다. 48 kHz 스테레오 출력 장치에서 기존 자동 샘플레이트 변환의 기계음 성분을 WASAPI loopback 녹음으로 재현했습니다. 장치 샘플레이트로 먼저 변환한 뒤에는 출력 주파수 성분이 원본과 일치했습니다. 앱 미리듣기의 진행과 X 종료, 기존 자동 검사도 확인했습니다. 실제 키보드 타건과 청취 확인, 다른 출력 장치는 추가 검증이 필요합니다.

## 빌드

1.2.3에서 버튼과 곡 선택창에 라운딩을 적용했습니다. 버튼과 펼침 화살표는 Lucide 공식 SVG를 사용하며 Windows에서 재생/일시정지, 리셋, 곡 선택창의 표시를 확인했습니다. 아이콘 출처는 https://github.com/lucide-icons/lucide 이며 라이선스는 `Assets/LUCIDE-LICENSE.txt`에 포함되어 있습니다.

.NET 10 SDK:

```
dotnet run --project Tests/Tests.csproj
dotnet publish Pianotype.csproj -c Release -r win-x64 --self-contained true -o publish/win-x64
```

`Assets/songs.json`과 피아노 샘플은 실행 파일 안에 포함됩니다. 오디오/악보 출처는 `Assets/CREDITS.txt`, `Assets/AUDIO-CREDITS.txt`를 참고하세요. NAudio는 MIT 라이선스입니다.
