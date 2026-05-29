interface ExplanationBoxProps {
  explanation: string | null;
  isVisible: boolean;
}

export function ExplanationBox({ explanation, isVisible }: ExplanationBoxProps) {
  if (!isVisible || !explanation) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
        💡 Объяснение:
      </div>
      <div
        className="prose dark:prose-invert prose-sm max-w-none text-blue-900 dark:text-blue-100"
        dangerouslySetInnerHTML={{ __html: explanation }}
      />
    </div>
  );
}
