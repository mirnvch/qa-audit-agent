// Маппинг строковых имён иконок (из course-config) на компоненты lucide-react.
// Только то, что реально используется в курсе, чтобы не раздувать бандл.
//
// Экспортируем компонент <ModuleIcon name="..." />, а не функцию `getIcon(): Component`,
// чтобы соответствовать правилу `react-hooks/static-components`: компоненты не должны
// создаваться/выбираться внутри render. Здесь же выбор инкапсулирован в один компонент,
// который React видит как стабильный.

import {
  Layers,
  Compass,
  Boxes,
  FolderTree,
  Settings2,
  KeyRound,
  Component,
  LifeBuoy,
  TestTube2,
  Activity,
  GitBranch,
  Wrench,
} from 'lucide-react'

type Props = {
  name: string
  className?: string
}

export function ModuleIcon({ name, className }: Props) {
  switch (name) {
    case 'Layers':     return <Layers     className={className} />
    case 'Compass':    return <Compass    className={className} />
    case 'Boxes':      return <Boxes      className={className} />
    case 'FolderTree': return <FolderTree className={className} />
    case 'Settings2':  return <Settings2  className={className} />
    case 'KeyRound':   return <KeyRound   className={className} />
    case 'Component':  return <Component  className={className} />
    case 'LifeBuoy':   return <LifeBuoy   className={className} />
    case 'TestTube2':  return <TestTube2  className={className} />
    case 'Activity':   return <Activity   className={className} />
    case 'GitBranch':  return <GitBranch  className={className} />
    case 'Wrench':     return <Wrench     className={className} />
    default:           return <Layers     className={className} />
  }
}
