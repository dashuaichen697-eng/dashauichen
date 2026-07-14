import { FileSpreadsheet, PackageOpen } from 'lucide-react';

const tools = [
  {
    href: '/carton-mark',
    title: '箱唛自动生成器',
    description: '上传 Excel，生成每箱一页的 Word 箱唛。',
    icon: PackageOpen
  },
  {
    href: '/packing-list',
    title: '发票转装箱单',
    description: '上传巴西海运发票，自动生成海运装箱单。',
    icon: FileSpreadsheet
  }
];

export default function HomePage() {
  const basePath = import.meta.env.BASE_URL;

  return (
    <main className="app-shell">
      <section className="toolbox-hero">
        <p className="eyebrow">物流文档工具箱</p>
        <h1>物流文档工具箱</h1>
        <p className="subtitle">把常用物流 Excel、Word 文档处理工具放在同一个入口，互不覆盖，独立打开。</p>
      </section>
      <section className="tool-card-grid">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <a className="tool-card" href={`${basePath}#${tool.href}`} key={tool.href}>
              <span className="tool-card-icon"><Icon size={24} /></span>
              <strong>{tool.title}</strong>
              <span>{tool.description}</span>
            </a>
          );
        })}
      </section>
    </main>
  );
}
