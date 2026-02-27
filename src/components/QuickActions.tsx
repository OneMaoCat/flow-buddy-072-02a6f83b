const chips = [
  "修 Bug",
  "开发新功能",
  "代码审查",
  "写单元测试",
  "重构代码",
  "搭建页面",
  "设计数据库",
  "生成 API",
  "性能优化",
  "部署上线",
];

const QuickActions = () => {
  return (
    <div className="flex flex-wrap justify-center gap-2 max-w-[860px] mx-auto">
      {chips.map((chip) => (
        <button
          key={chip}
          className="px-4 py-2 rounded-full bg-chip text-chip-text text-sm hover:bg-chip-hover transition-colors"
        >
          {chip}
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
