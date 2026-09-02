import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 페이지 CSS를 청크별로 쪼개지 않고 한 파일로 유지한다.
    //
    // 이 프로젝트의 페이지 CSS는 CSS Modules가 아니라 전역이고, 스코프 없는
    // 규칙(.card / .no_image / .page-main / .primary_btn:hover / .toastui-editor-contents ...)을
    // 여러 페이지가 서로 빌려 쓰고 있다. 지금까지는 모든 CSS가 한 번들에 합쳐지면서
    // 그게 우연히 성립했다.
    //
    // 라우트를 React.lazy로 나누면 JS와 함께 CSS도 쪼개져 그 우연이 깨진다.
    // 실제로 /club/:id를 직접 열면 소개글에 필요한 .toastui-editor-contents 규칙이
    // 빠져 화면이 깨졌다(#20 -> #21에서 revert).
    //
    // CSS만 합쳐두면 캐스케이드가 예전과 동일해 어떤 페이지도 규칙을 잃지 않으면서,
    // 무거운 JS(Toast UI Editor gzip 280 kB)는 그대로 지연 로드된다.
    // 페이지 CSS를 각자 스코프로 정리하면 그때 이 옵션을 없앨 수 있다.
    cssCodeSplit: false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
