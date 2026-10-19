# 执行证据如何对应回代码

~~~text
埋点 / 系统采样 / 锁与内存事件 / GPU 时间查询
  → 采集记录与线程上下文 → 后台传输
  → 分析器：时间轴、符号解析、统计与对比
  → 开发者或 AI 提出修改，再独立复测
~~~

## 调用栈采样

系统周期性获取执行位置和调用栈。匹配调试符号后映射到函数、文件和行号，重复出现的路径形成热点线索。

样本占比是统计结果，短调用可能漏采；调用栈包含某函数不等于时间全耗在其自身，需要区分 self 与 total。优化、内联、栈展开和采样偏移均影响解释。

## 作用域区间

以下是本研究编写的最小用法示例：

~~~cpp
void DecodeTexture() {
    ZoneScoped;
    // 原有业务实现
}
~~~

宏关联函数、文件、行号和 ScopedZone 对象；构造写入 ZoneBegin、时间和位置，离开作用域析构写入 ZoneEnd。按线程与嵌套上下文配对，得到区间持续时间。调用栈采集是可选附加能力。

源码：[Tracy.hpp](https://github.com/wolfpld/tracy/blob/fd23005a67e25f53dd420df6350a2f5907afedc3/public/tracy/Tracy.hpp)、[TracyScoped.hpp](https://github.com/wolfpld/tracy/blob/fd23005a67e25f53dd420df6350a2f5907afedc3/public/client/TracyScoped.hpp)、[TracyProfiler.hpp](https://github.com/wolfpld/tracy/blob/fd23005a67e25f53dd420df6350a2f5907afedc3/public/client/TracyProfiler.hpp)。

行号只标明区间定义位置。一个长区间还可能包含子调用、等待、I/O 或未被调度的时间。

## 调度与锁

上下文切换记录线程何时运行或切出；已接入锁的等待、获得、释放事件给出锁与线程关系。对齐后可追查长区间与持有者。

时间重叠不自动构成因果。没有锁、等待栈或业务依赖证据时，不能因另一线程很忙就断言它造成延迟。

## 内存

分配接入上报地址、大小和时间，释放上报相应地址，可选择关联调用栈。分析器追踪已报告分配的存活与来源。未上报的第三方分配或系统内存不会自然成为完整统计。

## GPU 与接入边界

对应 API 的设备时间查询产生 GPU 区间；CPU 提交函数的墙钟时间不等于 GPU 执行时间。

集成客户端后可以先采样。帧边界、业务区间、锁、GPU、内存与自定义指标仍需相应采集。未发布 Linux 外部 monitor 是另一条路径，本项目没有执行它。
