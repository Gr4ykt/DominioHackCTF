import { api } from "../main"
import type {
  AnswerResult,
  ModuleDetail,
  UserModuleListItem,
  UserQuestion,
} from "../types"

export const modules = {
  list() {
    return api.get<UserModuleListItem[]>("/modules").then((r) => r.data)
  },
  get(idOrSlug: string) {
    return api.get<ModuleDetail>(`/modules/${idOrSlug}`).then((r) => r.data)
  },
  questions(idOrSlug: string) {
    return api
      .get<UserQuestion[]>(`/modules/${idOrSlug}/questions`)
      .then((r) => r.data)
  },
  answer(idOrSlug: string, questionId: string, answer: string) {
    return api
      .post<AnswerResult>(`/modules/${idOrSlug}/answer`, {
        question_id: questionId,
        answer,
      })
      .then((r) => r.data)
  },
}
