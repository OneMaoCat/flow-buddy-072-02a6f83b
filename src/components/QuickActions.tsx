const chips = [
  "生成PPT",
  "生成创意PPT",
  "写云文档",
  "写报告",
  "搭建网页",
  "搭建仪表盘",
  "创建多维表格",
  "生成图片",
  "Excel",
  "对话模式",
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
