import { Check, ChevronLeft, CirclePlus, Gift, Pencil, Settings2, Target, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_COLORS, WEEKDAYS } from '../data/gameConfig';
import { getScheduleLabel } from '../utils/game';

const sections = [
  { id: 'tasks', label: '任务', icon: Settings2 },
  { id: 'rewards', label: '奖励', icon: Gift },
  { id: 'categories', label: '分类', icon: CirclePlus },
  { id: 'quests', label: '主线', icon: Target }
];

const TASK_TYPE_LABELS = {
  daily: '今日任务',
  longTerm: '长期任务',
  custom: '自定义任务'
};

export default function Settings({ game }) {
  const [section, setSection] = useState('tasks');

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gold/20 bg-obsidian p-4">
        <h1 className="text-2xl font-black text-white">设置</h1>
        <p className="mt-2 text-sm text-white/55">任务、奖励、分类与主线目标</p>
      </section>

      <div className="grid grid-cols-4 gap-1 rounded-lg bg-black/30 p-1">
        {sections.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`flex h-11 items-center justify-center gap-1.5 rounded-md text-xs font-bold ${section === item.id ? 'bg-gold text-void' : 'text-white/55'}`}
            >
              <Icon size={15} />{item.label}
            </button>
          );
        })}
      </div>

      {section === 'tasks' && <TaskManager game={game} />}
      {section === 'rewards' && <RewardManager game={game} />}
      {section === 'categories' && <CategoryManager game={game} />}
      {section === 'quests' && <QuestManager game={game} />}
    </div>
  );
}

function SectionHeader({ title, actionLabel, onAction, disabled = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className="flex h-10 items-center gap-1.5 rounded-lg bg-gold px-3 text-sm font-bold text-void disabled:opacity-40"
      >
        <CirclePlus size={17} />{actionLabel}
      </button>
    </div>
  );
}

function TaskManager({ game }) {
  const { state, onSaveTask, onToggleTask, onDeleteTask } = game;
  const [editing, setEditing] = useState(null);

  function startNew() {
    if (!state.categories.length) return;
    setEditing({ name: '', categoryId: state.categories[0].id, taskType: 'daily', xp: 5, gold: 5, schedule: { type: 'daily', days: [] }, enabled: true });
  }

  if (editing) {
    return <TaskEditor task={editing} categories={state.categories} onCancel={() => setEditing(null)} onSave={(task) => { onSaveTask(task); setEditing(null); }} />;
  }

  return (
    <section className="space-y-3">
      <SectionHeader title={`全部任务 · ${state.tasks.length}`} actionLabel="新增" onAction={startNew} disabled={!state.categories.length} />
      {!state.categories.length && <Notice>请先新增一个任务分类。</Notice>}
      {state.tasks.map((task) => {
        const category = state.categories.find((item) => item.id === task.categoryId);
        return (
          <div key={task.id} className={`rounded-lg border p-4 ${task.enabled ? 'border-gold/15 bg-black/24' : 'border-white/10 bg-white/[.03] opacity-70'}`}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
                  <span style={{ color: category?.color }}>{category?.name ?? '未分类'}</span>
                  <span>{TASK_TYPE_LABELS[task.taskType] ?? '自定义任务'}</span>
                  <span>{getScheduleLabel(task.schedule)}</span>
                </div>
                <h3 className="mt-1 break-words font-bold text-white">{task.name}</h3>
                <p className="mt-1 text-sm text-amberline">{task.xp} XP · {task.gold} 金币</p>
              </div>
              <Toggle checked={task.enabled} onChange={() => onToggleTask(task.id)} label={task.enabled ? '停用任务' : '启用任务'} />
            </div>
            <div className="mt-3 flex justify-end gap-2 border-t border-white/5 pt-3">
              <IconButton label="编辑任务" onClick={() => setEditing(task)}><Pencil size={17} /></IconButton>
              <IconButton label="删除任务" danger onClick={() => window.confirm(`删除任务“${task.name}”？历史完成记录会保留。`) && onDeleteTask(task.id)}><Trash2 size={17} /></IconButton>
            </div>
          </div>
        );
      })}
      {!state.tasks.length && <Notice>暂无任务。</Notice>}
    </section>
  );
}

function TaskEditor({ task, categories, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({ ...task, taskType: task.taskType ?? 'daily', schedule: { type: task.schedule?.type ?? 'daily', days: [...(task.schedule?.days ?? [])] } }));
  const valid = form.name.trim() && form.categoryId && Number(form.xp) >= 0 && Number(form.gold) >= 0 && (form.taskType !== 'daily' || form.schedule.type !== 'weekdays' || form.schedule.days.length);

  function toggleDay(day) {
    setForm((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        days: current.schedule.days.includes(day) ? current.schedule.days.filter((item) => item !== day) : [...current.schedule.days, day]
      }
    }));
  }

  return (
    <section className="glass-panel rounded-lg p-4">
      <EditorTitle title={form.id ? '编辑任务' : '新增任务'} onCancel={onCancel} />
      <div className="mt-4 space-y-4">
        <Field label="任务名称"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="输入任务名称" className="form-input" /></Field>
        <Field label="任务分类">
          <select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className="form-input">
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <Field label="任务类型">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/30 p-1">
            {[['daily', '今日'], ['longTerm', '长期'], ['custom', '自定义']].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, taskType: value, schedule: value === 'daily' ? { type: 'daily', days: [] } : { type: 'anytime', days: [] } })}
                className={`h-10 rounded-md text-xs font-bold ${form.taskType === value ? 'bg-gold text-void' : 'text-white/55'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="XP 奖励"><input type="number" min="0" value={form.xp} onChange={(event) => setForm({ ...form, xp: event.target.value })} className="form-input" /></Field>
          <Field label="金币奖励"><input type="number" min="0" value={form.gold} onChange={(event) => setForm({ ...form, gold: event.target.value })} className="form-input" /></Field>
        </div>
        {form.taskType === 'daily' ? (
          <Field label="执行周期">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/30 p-1">
              {[['daily', '每日'], ['weekdays', '指定星期']].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setForm({ ...form, schedule: { type: value, days: value === 'weekdays' ? form.schedule.days : [] } })} className={`h-10 rounded-md text-xs font-bold ${form.schedule.type === value ? 'bg-gold text-void' : 'text-white/55'}`}>{label}</button>
              ))}
            </div>
          </Field>
        ) : (
          <div className="rounded-lg bg-black/24 p-3 text-sm text-white/55">执行周期：不限周期，不自动计入今日战报。</div>
        )}
        {form.taskType === 'daily' && form.schedule.type === 'weekdays' && (
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => <button key={day.value} type="button" onClick={() => toggleDay(day.value)} className={`aspect-square rounded-md text-sm font-bold ${form.schedule.days.includes(day.value) ? 'bg-gold text-void' : 'bg-white/5 text-white/55'}`}>{day.label}</button>)}
          </div>
        )}
        <div className="flex items-center justify-between rounded-lg bg-black/24 p-3">
          <span className="text-sm font-bold text-white">启用任务</span>
          <Toggle checked={form.enabled} onChange={() => setForm({ ...form, enabled: !form.enabled })} label="切换任务状态" />
        </div>
        <SaveButton disabled={!valid} onClick={() => onSave(form)} />
      </div>
    </section>
  );
}

function RewardManager({ game }) {
  const { state, onSaveReward, onToggleReward, onDeleteReward } = game;
  const [editing, setEditing] = useState(null);

  if (editing) {
    return <RewardEditor reward={editing} onCancel={() => setEditing(null)} onSave={(reward) => { onSaveReward(reward); setEditing(null); }} />;
  }

  return (
    <section className="space-y-3">
      <SectionHeader title={`奖励管理 · ${state.rewards.length}`} actionLabel="新增" onAction={() => setEditing({ name: '', cost: 30, description: '', enabled: true })} />
      {state.rewards.map((reward) => (
        <div key={reward.id} className={`rounded-lg border p-4 ${reward.enabled ? 'border-gold/15 bg-black/24' : 'border-white/10 bg-white/[.03] opacity-70'}`}>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-amberline/70">{reward.cost} 金币</p>
              <h3 className="mt-1 break-words font-bold text-white">{reward.name}</h3>
              {reward.description && <p className="mt-1 text-xs leading-5 text-white/45">{reward.description}</p>}
            </div>
            <Toggle checked={reward.enabled} onChange={() => onToggleReward(reward.id)} label={reward.enabled ? '停用奖励' : '启用奖励'} />
          </div>
          <div className="mt-3 flex justify-end gap-2 border-t border-white/5 pt-3">
            <IconButton label="编辑奖励" onClick={() => setEditing(reward)}><Pencil size={17} /></IconButton>
            <IconButton label="删除奖励" danger onClick={() => window.confirm(`删除奖励“${reward.name}”？历史兑换记录会保留。`) && onDeleteReward(reward.id)}><Trash2 size={17} /></IconButton>
          </div>
        </div>
      ))}
      {!state.rewards.length && <Notice>暂无奖励，点击“新增”创建第一项奖励。</Notice>}
    </section>
  );
}

function RewardEditor({ reward, onSave, onCancel }) {
  const [form, setForm] = useState(reward);
  const valid = form.name.trim() && Number(form.cost) >= 0;

  return (
    <section className="glass-panel rounded-lg p-4">
      <EditorTitle title={form.id ? '编辑奖励' : '新增奖励'} onCancel={onCancel} />
      <div className="mt-4 space-y-4">
        <Field label="奖励名称"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="form-input" placeholder="输入奖励名称" /></Field>
        <Field label="消耗金币"><input type="number" min="0" value={form.cost} onChange={(event) => setForm({ ...form, cost: event.target.value })} className="form-input" /></Field>
        <Field label="奖励说明"><textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="form-input resize-none" placeholder="说明如何兑现这项奖励" /></Field>
        <div className="flex items-center justify-between rounded-lg bg-black/24 p-3">
          <span className="text-sm font-bold text-white">启用奖励</span>
          <Toggle checked={form.enabled} onChange={() => setForm({ ...form, enabled: !form.enabled })} label="切换奖励状态" />
        </div>
        <SaveButton disabled={!valid} onClick={() => onSave(form)} />
      </div>
    </section>
  );
}

function CategoryManager({ game }) {
  const { state, onSaveCategory, onDeleteCategory } = game;
  const [editing, setEditing] = useState(null);

  if (editing) {
    return <CategoryEditor category={editing} onCancel={() => setEditing(null)} onSave={(category) => { onSaveCategory(category); setEditing(null); }} />;
  }

  return (
    <section className="space-y-3">
      <SectionHeader title={`任务分类 · ${state.categories.length}`} actionLabel="新增" onAction={() => setEditing({ name: '', weight: 0, color: CATEGORY_COLORS[state.categories.length % CATEGORY_COLORS.length] })} />
      {state.categories.map((category) => {
        const taskCount = state.tasks.filter((task) => task.categoryId === category.id).length;
        return (
          <div key={category.id} className="flex items-center gap-3 rounded-lg border border-gold/15 bg-black/24 p-4">
            <span className="h-4 w-4 shrink-0 rounded-sm" style={{ backgroundColor: category.color }} />
            <div className="min-w-0 flex-1"><h3 className="font-bold text-white">{category.name}</h3><p className="text-xs text-white/45">权重 {category.weight}% · {taskCount} 个任务</p></div>
            <IconButton label="编辑分类" onClick={() => setEditing(category)}><Pencil size={17} /></IconButton>
            <IconButton label="删除分类" danger onClick={() => window.confirm(`删除分类“${category.name}”？`) && onDeleteCategory(category.id)}><Trash2 size={17} /></IconButton>
          </div>
        );
      })}
    </section>
  );
}

function CategoryEditor({ category, onSave, onCancel }) {
  const [form, setForm] = useState(category);
  return (
    <section className="glass-panel rounded-lg p-4">
      <EditorTitle title={form.id ? '编辑分类' : '新增分类'} onCancel={onCancel} />
      <div className="mt-4 space-y-4">
        <Field label="分类名称"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="form-input" placeholder="输入分类名称" /></Field>
        <Field label="分类权重"><input type="number" min="0" value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })} className="form-input" /></Field>
        <Field label="标识颜色"><div className="flex flex-wrap gap-2">{CATEGORY_COLORS.map((color) => <button key={color} type="button" aria-label={`选择颜色 ${color}`} onClick={() => setForm({ ...form, color })} className={`h-9 w-9 rounded-md border-2 ${form.color === color ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: color }} />)}</div></Field>
        <SaveButton disabled={!form.name.trim()} onClick={() => onSave(form)} />
      </div>
    </section>
  );
}

function QuestManager({ game }) {
  const { state, onSaveMainQuest, onDeleteMainQuest } = game;
  const [editing, setEditing] = useState(null);

  if (editing) {
    return <QuestEditor quest={editing} onCancel={() => setEditing(null)} onSave={(quest) => { onSaveMainQuest(quest); setEditing(null); }} />;
  }

  return (
    <section className="space-y-3">
      <SectionHeader title={`主线任务 · ${state.mainQuests.length}`} actionLabel="新增" onAction={() => setEditing({ name: '', period: '2026年', target: 0, current: 0, unit: '', showOnDashboard: true })} />
      {state.mainQuests.map((quest) => (
        <div key={quest.id} className="rounded-lg border border-gold/15 bg-black/24 p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1"><div className="text-xs text-white/45">{quest.period}{quest.showOnDashboard ? ' · 首页展示' : ' · 已隐藏'}</div><h3 className="mt-1 font-bold text-white">{quest.name}</h3><p className="mt-1 text-sm text-amberline">{quest.current} / {quest.target} {quest.unit}</p></div>
            <IconButton label="编辑主线" onClick={() => setEditing(quest)}><Pencil size={17} /></IconButton>
            <IconButton label="删除主线" danger onClick={() => window.confirm(`删除主线任务“${quest.name}”？`) && onDeleteMainQuest(quest.id)}><Trash2 size={17} /></IconButton>
          </div>
        </div>
      ))}
    </section>
  );
}

function QuestEditor({ quest, onSave, onCancel }) {
  const [form, setForm] = useState(quest);
  return (
    <section className="glass-panel rounded-lg p-4">
      <EditorTitle title={form.id ? '编辑主线任务' : '新增主线任务'} onCancel={onCancel} />
      <div className="mt-4 space-y-4">
        <Field label="主线任务名称"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="form-input" /></Field>
        <Field label="周期"><input value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })} className="form-input" placeholder="例如：2026年" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="年度目标"><input type="number" min="0" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} className="form-input" /></Field>
          <Field label="当前进度"><input type="number" min="0" value={form.current} onChange={(event) => setForm({ ...form, current: event.target.value })} className="form-input" /></Field>
        </div>
        <Field label="计量单位"><input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} className="form-input" placeholder="公里、个视频、条柜" /></Field>
        <div className="flex items-center justify-between rounded-lg bg-black/24 p-3"><span className="text-sm font-bold text-white">展示在首页</span><Toggle checked={form.showOnDashboard} onChange={() => setForm({ ...form, showOnDashboard: !form.showOnDashboard })} label="切换首页展示" /></div>
        <SaveButton disabled={!form.name.trim() || !form.unit.trim()} onClick={() => onSave(form)} />
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-amberline/70">{label}</span>{children}</label>;
}

function EditorTitle({ title, onCancel }) {
  return <div className="flex items-center gap-3"><button type="button" onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/60" aria-label="返回"><ChevronLeft size={19} /></button><h2 className="text-lg font-black text-white">{title}</h2></div>;
}

function SaveButton({ disabled, onClick }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold font-black text-void disabled:opacity-40"><Check size={18} />保存</button>;
}

function Toggle({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-emerald' : 'bg-white/15'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`} /></button>;
}

function IconButton({ label, onClick, danger = false, children }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${danger ? 'bg-ember/10 text-ember' : 'bg-white/5 text-white/60'}`}>{children}</button>;
}

function Notice({ children }) {
  return <div className="rounded-lg border border-dashed border-gold/20 p-5 text-center text-sm text-white/45">{children}</div>;
}
