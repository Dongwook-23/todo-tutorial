import { fireEvent, render } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme-provider";

const { setTheme, themeState } = vi.hoisted(() => ({
  setTheme: vi.fn(),
  themeState: { resolvedTheme: "light" as string },
}));

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ resolvedTheme: themeState.resolvedTheme, setTheme }),
}));

beforeEach(() => {
  setTheme.mockClear();
  themeState.resolvedTheme = "light";
});

describe("ThemeHotkey 토글", () => {
  it("일반 영역에서 d 키를 누르면 dark로 토글한다", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "d" });

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("resolvedTheme이 dark일 때 d 키를 누르면 light로 토글한다", () => {
    themeState.resolvedTheme = "dark";
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "d" });

    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("대문자 D를 눌러도 토글된다 (대소문자 무시)", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "D" });

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("d가 아닌 키는 무시한다", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "a" });

    expect(setTheme).not.toHaveBeenCalled();
  });
});

describe("ThemeHotkey 입력 필드 가드", () => {
  it("input에 포커스된 상태에서는 d 키를 눌러도 토글되지 않는다", () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <input data-testid="target" />
      </ThemeProvider>
    );

    fireEvent.keyDown(getByTestId("target"), { key: "d" });

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("textarea에 포커스된 상태에서는 d 키를 눌러도 토글되지 않는다", () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <textarea data-testid="target" />
      </ThemeProvider>
    );

    fireEvent.keyDown(getByTestId("target"), { key: "d" });

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("select에 포커스된 상태에서는 d 키를 눌러도 토글되지 않는다", () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <select data-testid="target" />
      </ThemeProvider>
    );

    fireEvent.keyDown(getByTestId("target"), { key: "d" });

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("contentEditable 요소에서는 d 키를 눌러도 토글되지 않는다", () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <div data-testid="target" />
      </ThemeProvider>
    );
    const target = getByTestId("target");
    // jsdom은 contentEditable 속성만으로 isContentEditable을 계산해주지 않으므로 직접 지정한다.
    Object.defineProperty(target, "isContentEditable", { value: true });

    fireEvent.keyDown(target, { key: "d" });

    expect(setTheme).not.toHaveBeenCalled();
  });
});

describe("ThemeHotkey 예외 무시", () => {
  it("ctrl+d 조합은 토글하지 않는다", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "d", ctrlKey: true });

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("meta+d 조합은 토글하지 않는다", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "d", metaKey: true });

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("alt+d 조합은 토글하지 않는다", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "d", altKey: true });

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("repeat(키 홀드) 이벤트는 무시한다", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "d", repeat: true });

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("이미 preventDefault된 이벤트는 무시한다", () => {
    const preventD = (event: KeyboardEvent) => {
      if (event.key === "d") event.preventDefault();
    };
    window.addEventListener("keydown", preventD);

    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );
    fireEvent.keyDown(window, { key: "d" });

    expect(setTheme).not.toHaveBeenCalled();
    window.removeEventListener("keydown", preventD);
  });

  it("언마운트 후에는 keydown 리스너가 동작하지 않는다", () => {
    const { unmount } = render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    unmount();
    fireEvent.keyDown(window, { key: "d" });

    expect(setTheme).not.toHaveBeenCalled();
  });
});
