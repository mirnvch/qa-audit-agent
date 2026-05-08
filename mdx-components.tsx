// Спецфайл @next/mdx. Этот хук вызывается MDX-runtime'ом для каждого .mdx-файла
// и определяет, какие React-компоненты будут доступны как JSX-теги внутри MDX.
//
// Авторам уроков НЕ нужно их импортировать — теги вроде <Quiz>, <Checklist>,
// <TextAnswerExercise> доступны «из коробки».
//
// Документация: https://nextjs.org/docs/app/building-your-application/configuring/mdx

import type { MDXComponents } from 'mdx/types'

import { Quiz } from '@/components/learn/Quiz'
import { Checklist } from '@/components/learn/Checklist'
import { TextAnswerExercise } from '@/components/learn/TextAnswerExercise'
import { AskClaudeButton } from '@/components/learn/AskClaudeButton'
import { Glossary, GlossaryTooltip } from '@/components/learn/GlossaryTooltip'
import { Diagram } from '@/components/learn/Diagram'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    // Кастомные компоненты курса
    Quiz,
    Checklist,
    TextAnswerExercise,
    AskClaude: AskClaudeButton,
    AskClaudeButton,
    Glossary,
    GlossaryTooltip,
    Diagram,
  }
}
