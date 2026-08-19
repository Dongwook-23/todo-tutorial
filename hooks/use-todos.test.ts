import { act, renderHook, waitFor } from "@testing-library/react";
import { useTodos } from "@/hooks/use-todos";

beforeEach(() => {
  localStorage.clear();
});

describe("useTodos 우선순위", () => {
  it("addTodo에 전달한 우선순위로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기", "high");
    });

    expect(result.current.todos[0]).toMatchObject({
      text: "장보기",
      priority: "high",
      completed: false,
    });
  });

  it("우선순위를 생략하면 기본값(medium)으로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("청소");
    });

    expect(result.current.todos[0].priority).toBe("medium");
  });

  it("priority가 없는 기존 저장 데이터는 medium으로 보정해 로드한다", async () => {
    localStorage.setItem(
      "todos",
      JSON.stringify([{ id: "1", text: "구버전 할 일", completed: false }])
    );

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].priority).toBe("medium");
  });

  it("추가한 우선순위를 localStorage에 저장한다", async () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기", "low");
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("todos") ?? "[]");
      expect(stored[0]?.priority).toBe("low");
    });
  });
});

describe("useTodos 마감일", () => {
  it("addTodo에 전달한 마감일로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("회의", "medium", "2026-07-01");
    });

    expect(result.current.todos[0]).toMatchObject({
      text: "회의",
      dueDate: "2026-07-01",
    });
  });

  it("마감일을 생략하면 dueDate 없이 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("청소");
    });

    expect(result.current.todos[0].dueDate).toBeUndefined();
  });

  it("새로 추가한 Todo에는 생성 시각(createdAt)이 기록된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("회의");
    });

    expect(typeof result.current.todos[0].createdAt).toBe("number");
  });

  it("createdAt이 없는 기존 데이터는 number로 보정해 로드한다", async () => {
    localStorage.setItem(
      "todos",
      JSON.stringify([
        { id: "1", text: "구버전 할 일", completed: false, priority: "medium" },
      ])
    );

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(typeof result.current.todos[0].createdAt).toBe("number");
  });
});

describe("useTodos 카테고리", () => {
  it("addTodo에 전달한 카테고리로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("보고서", "medium", undefined, "work");
    });

    expect(result.current.todos[0].category).toBe("work");
  });

  it("카테고리를 생략하면 category 없이 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("청소");
    });

    expect(result.current.todos[0].category).toBeUndefined();
  });
});

describe("useTodos 손상 데이터 보호", () => {
  it("파싱할 수 없는 저장값을 빈 배열로 덮어쓰지 않는다", async () => {
    localStorage.setItem("todos", "{이건 JSON이 아님");

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.todos).toEqual([]);
    // 손상된 원본이 보존돼 복구 여지가 남아야 한다
    expect(localStorage.getItem("todos")).toBe("{이건 JSON이 아님");
  });

  it("배열이 아닌 저장값도 덮어쓰지 않는다", async () => {
    localStorage.setItem("todos", JSON.stringify({ x: 1 }));

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.todos).toEqual([]);
    expect(localStorage.getItem("todos")).toBe('{"x":1}');
  });

  it("손상 데이터 로드 후 새 항목을 추가하면 정상적으로 저장된다", async () => {
    localStorage.setItem("todos", "{이건 JSON이 아님");

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.addTodo("새 할 일");
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("todos") ?? "null");
      expect(Array.isArray(stored)).toBe(true);
      expect(stored[0]?.text).toBe("새 할 일");
    });
  });
});

describe("useTodos toggleTodo/deleteTodo", () => {
  it("toggleTodo는 해당 id의 completed만 반전시킨다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
      result.current.addTodo("청소");
    });
    const [second, first] = result.current.todos;

    act(() => {
      result.current.toggleTodo(first.id);
    });

    expect(result.current.todos.find((t) => t.id === first.id)?.completed).toBe(
      true
    );
    expect(
      result.current.todos.find((t) => t.id === second.id)?.completed
    ).toBe(false);
  });

  it("toggleTodo를 두 번 호출하면 원상 복귀된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const { id } = result.current.todos[0];

    act(() => {
      result.current.toggleTodo(id);
    });
    act(() => {
      result.current.toggleTodo(id);
    });

    expect(result.current.todos[0].completed).toBe(false);
  });

  it("toggleTodo에 존재하지 않는 id를 넘기면 아무 변화가 없다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const before = result.current.todos;

    act(() => {
      result.current.toggleTodo("존재하지-않는-id");
    });

    expect(result.current.todos).toEqual(before);
  });

  it("deleteTodo는 해당 id만 제거하고 나머지 순서를 유지한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
      result.current.addTodo("청소");
      result.current.addTodo("회의");
    });
    const [third, second, first] = result.current.todos;

    act(() => {
      result.current.deleteTodo(second.id);
    });

    expect(result.current.todos.map((t) => t.id)).toEqual([
      third.id,
      first.id,
    ]);
  });

  it("마지막 항목을 삭제하면 빈 배열이 되고 localStorage도 비워진다", async () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const { id } = result.current.todos[0];

    act(() => {
      result.current.deleteTodo(id);
    });

    expect(result.current.todos).toEqual([]);
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("todos") ?? "null")).toEqual([]);
    });
  });

  it("deleteTodo에 존재하지 않는 id를 넘기면 아무 변화가 없다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const before = result.current.todos;

    act(() => {
      result.current.deleteTodo("존재하지-않는-id");
    });

    expect(result.current.todos).toEqual(before);
  });
});

describe("useTodos editTodo", () => {
  it("해당 id의 text만 변경하고 다른 필드는 유지한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기", "high", "2026-07-01", "work");
    });
    const original = result.current.todos[0];

    act(() => {
      result.current.editTodo(original.id, "마트에서 장보기");
    });

    expect(result.current.todos[0]).toMatchObject({
      id: original.id,
      text: "마트에서 장보기",
      priority: original.priority,
      dueDate: original.dueDate,
      category: original.category,
      completed: original.completed,
    });
  });

  it("편집한 텍스트의 앞뒤 공백을 제거하고 저장한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const { id } = result.current.todos[0];

    act(() => {
      result.current.editTodo(id, "  청소하기  ");
    });

    expect(result.current.todos[0].text).toBe("청소하기");
  });

  it("빈 문자열로 편집하면 해당 항목이 삭제된다", async () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
      result.current.addTodo("청소");
    });
    const target = result.current.todos[1];

    act(() => {
      result.current.editTodo(target.id, "");
    });

    expect(result.current.todos.find((t) => t.id === target.id)).toBeUndefined();
    expect(result.current.todos).toHaveLength(1);
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("todos") ?? "[]");
      expect(stored.find((t: { id: string }) => t.id === target.id)).toBeUndefined();
    });
  });

  it("공백만 있는 문자열로 편집해도 해당 항목이 삭제된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const { id } = result.current.todos[0];

    act(() => {
      result.current.editTodo(id, "   ");
    });

    expect(result.current.todos).toEqual([]);
  });

  it("editTodo에 존재하지 않는 id를 넘기면 아무 변화가 없다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기");
    });
    const before = result.current.todos;

    act(() => {
      result.current.editTodo("존재하지-않는-id", "새 텍스트");
    });

    expect(result.current.todos).toEqual(before);
  });
});
