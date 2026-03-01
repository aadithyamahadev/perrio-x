import applyHardcodedTranslations from "../localTranslations";

describe("hardcoded translation fallback", () => {
  it("converts standalone digits into Hindi words", () => {
    const questions = [
      { id: "1", question_text: "Count 1, 2, 3", hint: "" } as any,
    ];
    const hi = applyHardcodedTranslations(questions, "hi");
    expect(hi[0].question_text).toContain("एक");
    expect(hi[0].question_text).toContain("दो");
    expect(hi[0].question_text).toContain("तीन");
  });

  it("converts numbers in expressions but preserves attached digits (like '2x')", () => {
    const questions = [{ id: "2", question_text: "Solve 2x + 5 = 15", hint: "" } as any];
    const hi = applyHardcodedTranslations(questions, "hi");
    // 2x should stay as-is, but 5 and 15 should be turned into words
    expect(hi[0].question_text).toContain("2x");
    expect(hi[0].question_text).toContain("पाँच");
    expect(hi[0].question_text).toContain("एकपाँच");
  });
});
