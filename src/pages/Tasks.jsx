import TaskItem from '../components/TaskItem';
import { getLongTermTasks } from '../utils/game';

function groupTasks(tasks, categories) {
  return categories.map((category) => ({
    ...category,
    tasks: tasks.filter((task) => task.categoryId === category.id)
  })).filter((group) => group.tasks.length);
}

export default function Tasks({ game }) {
  const { todaySummary, dateKey, state, onCompleteTask } = game;
  const todayGroups = groupTasks(todaySummary.tasks, state.categories);
  const longTermGroups = groupTasks(getLongTermTasks(state.tasks), state.categories);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gold/20 bg-obsidian p-4">
        <p className="text-xs text-amberline/60">{dateKey}</p>
        <h1 className="mt-1 text-2xl font-black text-white">今日任务</h1>
        <p className="mt-2 text-sm text-white/55">奖励按任务配置即时结算，修改配置不会改变历史记录。</p>
      </section>

      {todayGroups.map((group) => (
        <section key={group.id} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black text-white">{group.name}</h2>
            <span className="text-xs text-amberline/60">{group.weight}% 权重</span>
          </div>
          {group.tasks.map((task) => (
            <TaskItem key={task.id} task={task} done={Boolean(state.completions[dateKey]?.[task.id])} onComplete={onCompleteTask} />
          ))}
        </section>
      ))}

      {!todayGroups.length && <div className="rounded-lg border border-dashed border-gold/20 p-6 text-center text-sm text-white/45">今天没有匹配执行周期的任务。</div>}

      <section className="mt-7 rounded-lg border border-gold/20 bg-obsidian p-4">
        <h2 className="text-xl font-black text-white">长期任务</h2>
        <p className="mt-2 text-sm text-white/55">持续推进，不计入首页今日战报。</p>
      </section>

      {longTermGroups.map((group) => (
        <section key={`long-${group.id}`} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black text-white">{group.name}</h2>
            <span className="text-xs text-amberline/60">长期推进</span>
          </div>
          {group.tasks.map((task) => (
            <TaskItem key={task.id} task={task} done={Boolean(state.completions[dateKey]?.[task.id])} onComplete={onCompleteTask} />
          ))}
        </section>
      ))}

      {!longTermGroups.length && <div className="rounded-lg border border-dashed border-gold/20 p-6 text-center text-sm text-white/45">暂无长期任务。可在“设置”中新增。</div>}
    </div>
  );
}
