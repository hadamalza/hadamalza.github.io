# 부적소 작업 기준

- 부적소의 유일한 작업 폴더는 이 디렉터리입니다. 별도 dist 복사본을 만들지 않습니다.
- HTML/CSS/JavaScript를 직접 수정하는 정적 사이트입니다. 빌드 과정이 없습니다.
- 아카이브 루트에서 `python3 -m http.server 8000 --bind 127.0.0.1`로 실행합니다.
- 로컬 주소: http://localhost:8000/bujeok-studio/
- GitHub Pages 주소: https://hadamalza.github.io/bujeok-studio/
- 공개 반영은 아카이브 저장소의 main 브랜치에 push할 때 실행됩니다.
- tools/build-brush-fonts.py는 tools/font-sources의 원본 폰트로 vendor/brush-fonts를 생성합니다. fonttools가 필요합니다.
