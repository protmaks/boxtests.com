export interface Test {
  test_id: number;
  display_name: string;
  group_id: number | null;
  subgroup_id: number | null;
  tags: string | null;
  difficulty_level_id: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: number;
  question_text: string;
  test_id: number;
  explanation: string | null;
  question_group_id: number | null;
}

export interface QuestionOption {
  id: number;
  question_id: number;
  test_id: number;
  option_letter: string;
  option_text: string;
  is_correct: boolean;
}

export interface TestGroup {
  id: number;
  name: string;
  description: string | null;
  color: string;
}

export interface TestSubgroup {
  id: number;
  name: string;
  group_id: number;
  description: string | null;
  color: string;
}

export interface DifficultyLevel {
  id: number;
  name: string;
  color: string;
  description: string | null;
  group_id: number;
}

export interface TestStatistics {
  id: number;
  test_id: number;
  total_attempts: number;
  total_correct: number;
  total_incorrect: number;
  total_skipped: number;
  last_attempt_at: string | null;
}

export interface SessionAnswer {
  id: number;
  test_id: number;
  question_id: number;
  selected_options: string;
  is_correct: boolean | null;
  status: 'answered' | 'skipped' | 'dont_know';
  answered_at: string;
}

export type QuestionWithOptions = Question & {
  options: QuestionOption[];
};

export type TestWithQuestions = Test & {
  questions: QuestionWithOptions[];
  group?: TestGroup;
  subgroup?: TestSubgroup;
  difficulty?: DifficultyLevel;
};
