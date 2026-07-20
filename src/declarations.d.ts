// CSS 모듈 와일드카드 선언
declare module "*.css" {
  const content: unknown;
  export default content;
}

// Toast UI 에디터는 React 19 타입 선언이 없으므로 직접 선언
declare module "@toast-ui/react-editor" {
  import type { RefObject } from "react";

  export interface EditorInstance {
    getHTML(): string;
  }

  export interface EditorProps {
    initialValue?: string;
    previewStyle?: "tab" | "vertical";
    height?: string;
    initialEditType?: "markdown" | "wysiwyg";
    useCommandShortcut?: boolean;
    usageStatistics?: boolean;
    placeholder?: string;
    onChange?: () => void;
    ref?: RefObject<{ getInstance(): EditorInstance } | null>;
    [key: string]: unknown;
  }

  export const Editor: React.ForwardRefExoticComponent<
    EditorProps & React.RefAttributes<{ getInstance(): EditorInstance }>
  >;
}
