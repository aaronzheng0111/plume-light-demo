# 运营看板（管理员）数据梳理与指标设计

> 面向 Cathay Hackathon / Plume Light 演示：管理员只读运营看板。  
> 本文梳理 **当前可展示数据**、**可接入的 OAG API 数据**、**衍生指标**，以及 **前后端分离 + Mock** 建议。  
> 对照代码：`pages/operations.html`、`assets/app.js`（`opsHTML`）、`assets/model.js`（`demand` / `aggregateBaggage` / `forecastCapacity`）、PRD §08 OPS01–OPS03。  
> OAG 来源：`OAG Developer Portal Guide`（Cathay Hackathon 2026）+ [Flight Info API Response Layout](https://knowledge.oag.com/docs/flight-info-api-response-layout-descriptions)。

---

## 0. 范围与权限约定

| 项 | 现状 | 目标约定 |
| --- | --- | --- |
| 页面 | `pages/operations.html`，`view=ops` | 保持独立入口 |
| 权限 | UI 文案「僅限國泰員工」，**无真实鉴权** | 前端路由守卫 + 后端 `/api/ops/*` 要求 admin token；本地 mock 可用 `X-Demo-Role: admin` |
| 数据平面 | 浏览器 `localStorage` 单体状态 | 拆成 **BFF/聚合 API** + 前端只消费 DTO |
| 航班锚点 | 固定演示 `CX257 · HKG→LHR · 2026-11-15` | 看板按 `legId` / `scheduleInstanceKey` 查询 |

---

## 1. 当前可展示数据全清单

按「前端是否已经算出来 / 画出来」列出。类型中 `null` 表示「未知或不可计算」，**不得当成 0**。

### 1.1 航班上下文（`state.flight`）

| 字段 | 类型 | 示例 / 默认 | 看板用途 |
| --- | --- | --- | --- |
| `flightNo` | string | `CX257` | 页眉航线 |
| `legId` | string | `CX257-20261115` | 聚合过滤键 |
| `bookingId` | string | `PL-CX257-DEMO` | 演示订票关联 |
| `origin` / `destination` | string (IATA) | `HKG` / `LHR` | 航段展示 |
| `terminal` | string | `T3` | 到达航站楼 |
| `departure` | ISO datetime | `2026-11-15T09:30:00+08:00` | 起飞时刻、截止对照 |
| `baggageAllowance` | object | 见下 | 与超额行李对比（看板可扩展） |

`baggageAllowance.travellers[travellerId]`：

| 字段 | 类型 | 示例 |
| --- | --- | --- |
| `pieces` | number | Lin `2`，Alex `1` |
| `kgPerPiece` | number | `23` |

### 1.2 运营参数（`state.ops`，可编辑演示输入）

| 字段 | 类型 | 默认 | 单位 | 说明 |
| --- | --- | --- | --- | --- |
| `budget` | number \| null | `5000` | kg | 航段重量预算（非机型最大起飞重量） |
| `spaceBudget` | number \| null | `22` | m³ | 航段空间预算 |
| `otherWeight` | number \| null | `1200` | kg | 已分配其他货物重量 |
| `buffer` | number \| null | `300` | kg | 运行重量缓冲 |
| `otherSpace` | number \| null | `5` | m³ | 已分配其他货物体积 |
| `spaceBuffer` | number \| null | `2` | m³ | 运行空间缓冲 |
| `expired` | boolean | `false` | — | 模拟运营数据过期 |

> 现状：参数面板暴露 `budget` / `spaceBudget` / `otherWeight` / `buffer` / `expired`；`otherSpace`、`spaceBuffer` 参与计算但 **UI 未提供编辑框**。

### 1.3 旅客申报明细（`state.declarations[travellerId]`）

演示人物仅 `PEOPLE = [Lin Chen, Alex Chen]`；航班其余旅客用硬编码基线（见 1.4）。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `items[]` | array | 行李件列表 |
| `items[].id` | string | 件 ID |
| `items[].name` | string \| i18n key | 显示名 |
| `items[].category` | string | 如 `clothes` / `books` |
| `items[].weight` | number \| null | kg；缺失则件级补估 20 kg |
| `items[].l` / `w` / `h` | number \| null | cm；任一缺失 → 体积未知 |
| `items[].mode` | `'checked'` \| … | 仅托运计入需求 |
| `items[].service` | boolean | 是否购买递送服务（**不重复计入**需求） |
| `items[].review` | boolean | 规则待复核 |
| `zero` | boolean | 明确 0 件托运 |
| `countUnknown` | boolean | 件数未知 → 不进「已报」聚合 |
| `version` | number | 每旅客每航段最新版 |
| `legId` | string | 必须匹配当前航班 |
| `status` | `'submitted'` | 已保存预报 |
| `updatedAt` | ISO datetime | 申报更新时间 |

单旅客需求 `demand(declaration)` 输出：

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `count` | number \| null | 托运件数；`countUnknown` → `null` |
| `weight` | number | `known + imputed` |
| `imputed` | number | 系统补估 kg |
| `volume` | number \| null | Σ(l×w×h)/1e6 m³ |
| `review` | number | 待复核件数 |

### 1.4 航班聚合（`aggregateBaggage()`）

硬编码演示基线（100 名乘机人）：

| 常量 | 值 | 含义 |
| --- | --- | --- |
| 总乘机人 | `100` | 固定 |
| 其他已报旅客 | `79` | 不含本地 `declarations` |
| 其他已报重量 | `1140` kg | |
| 其他已报件数 | `114` | |
| 其他已报体积 | `7` m³ | |
| 未报补估 | `30` kg / 人 | |
| 未报体积补估 | `0.15` m³ / 人 | |
| 无预报行李基线 | `2400` kg | 对比叙事用 |

聚合输出：

| 字段 | 类型 | 公式 / 含义 | 当前 UI |
| --- | --- | --- | --- |
| `reported` | number | `79 + 本地 submitted 且非 countUnknown 的申报数` | 文案「n 人已报」 |
| `unreported` | number | `100 - reported` | 「m 人待报」 |
| `coverage` | number | **等于 `reported`**（依赖总人数=100 才可当 %） | KPI「覆盖率 %」 |
| `known` | number | 已知重量 kg | 「已知 n」 |
| `imputed` | number | 系统补估 kg | 「补估 m」 |
| `weight` | number | `known + imputed` | 「预计托运总重」 |
| `pieces` | number | 已知件数 | 计算卡 / 剖面区 |
| `volume` | number \| null | 外形体积；有缺失尺寸 → `null` | 剖面区 / 计算卡 |
| `reviews` | number | 待复核件数合计 | notice |

### 1.5 容量预测（`forecastCapacity()`）

| 字段 | 类型 | 公式 | 当前 UI |
| --- | --- | --- | --- |
| （继承 1.4 全部字段） | | | |
| `weightRemaining` | number \| null | `budget − weight − otherWeight − buffer` | 「重量规划余量」 |
| `spaceRemaining` | number \| null | `spaceBudget − volume − otherSpace − spaceBuffer` | 「空间规划余量」 |
| `expired` | boolean | 来自 `ops.expired` | 余量显示「待确认」 |

派生展示量（仅在 `opsHTML` 计算，未进 model）：

| 名称 | 类型 | 公式 |
| --- | --- | --- |
| `baseline`（基线重量余量） | number \| null | `budget − 2400 − otherWeight − buffer` |
| `missing` | boolean | 任一余量为 `null` |
| `negative` | boolean | 任一余量 `< 0` |

### 1.6 时间与演示控制（影响看板解读）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `state.clock` | ISO datetime | 演示「当前时间」 |
| `state.lastSavedAt` | ISO datetime \| null | 最近保存预报时间 |
| `declaration.updatedAt` | ISO datetime | 表内展示用 |

### 1.7 已存在但看板未展示、可纳入管理员视图的本地数据

这些数据已在旅客端 / 行程端产生，**聚合进运营看板即可增值**（无需新 API）：

| 数据 | 类型 / 来源 | 运营价值 |
| --- | --- | --- |
| `orders[]` | 已支付服务订单快照 | 服务行李件数、运输方式（随航班 / Cargo）、目的地物流 |
| `orders[].itemIds` | string[] | 服务覆盖的行李子集 |
| `orders[].transport` | `'flight'` \| `'cargo'` \| `'mixed'` | 货舱 vs 客机行李分流 |
| `orders[].status` | `paid_demo` / `completed` / `cancelled` | 服务漏斗 |
| `events[]` | 交接事件 | 到机场 / 装机 / 伦敦交接完成率 |
| `extraBags` | 超额件数字典 | 超额行李压力 |
| 票面额度 `baggageAllowance` | pieces × kg | 申报重量 vs 免费额对比 |
| AI `review` 标记 | boolean | 合规风险队列 |

### 1.8 典型演示样例数值（Lin 已保存约 60 kg / 4 件时）

| 指标 | 值 |
| --- | --- |
| 覆盖率 | 80%（80 已报 / 20 待报） |
| 预计托运总重 | ≈ 1800 kg（已知 1200 + 补估 600） |
| 重量规划余量 | ≈ 1700 kg（5000 − 1800 − 1200 − 300） |
| 空间规划余量 | ≈ 4.6 m³（视体积聚合） |
| 无预报基线余量 | 1100 kg（5000 − 2400 − 1200 − 300） |

---

## 2. 可添加的外部数据：OAG（Hackathon 配额）

Portal：`developers.oag.com`。Hackathon 免费档：

| API | 配额 | 适合运营看板的内容 |
| --- | --- | --- |
| **Flight Info API** | 1000 req / 30 天 · 10 results/req | 时刻、机型、座位、货运吨位、状态/延误 |
| **Flight Info Connections API** | 与上共享配额 | 联程（次要） |
| **Master Data API** | 100 req / 30 天 · 1 result/req | 机场 / 航司 / 机型字典 enrichment |

### 2.1 推荐查询（对准 CX257）

```http
GET /flight-instances/
  ?CarrierCode=CX
  &FlightNumber=257
  &DepartureAirport=HKG
  &ArrivalAirport=LHR
  &DepartureDateTime=2026-11-15
  &CodeType=IATA
  &Codeshare=OPERATING
  &Content=SEATS,STATUS
```

必填：`DepartureDateTime` 或 `ArrivalDateTime`，且需 `CarrierCode` 或机场对。

### 2.2 Flight Info — 核心时刻 / 航段字段

| 响应字段 | 类型（逻辑） | 看板用途 |
| --- | --- | --- |
| `carrier` / `flightNumber` | string / number | 校验演示航班 |
| `scheduleInstanceKey` | string | 稳定航班实例 ID |
| `departure.airport.*` | IATA/ICAO/FAA | 出发站 |
| `departure.terminal` | string | 出发航站楼 |
| `departure.date/time` local+utc | string | 计划起飞 |
| `arrival.*` | 同上 | 计划到达 |
| `elapsedTime` | number (min) | 航段时长 |
| `aircraftType.iata` / `.icao` | string | 计划机型 |
| `serviceType` | string | 客/货等 |
| `numberOfStops` / `intermediateAirports` | number / array | 经停 |
| `codeshare.*` / `operatingFlight.*` | object | 实际承运 |
| `cargoTonnage` | number | **最大货运能力（与行李规划强相关）** |
| `distance.*` | number | 航距（次要） |

### 2.3 Content=SEATS / ActualSeats

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `seatingCapacity.predicted.totalSeats` | number | 预测总座位数 |
| `…firstClass` / `businessClass` / `premiumEconomyClass` / `economyPlusClass` / `economyClass` | number | 分舱 |
| `seatingCapacity.actual.*` | number | 实际机尾对应座位数（需识别到注册号） |

### 2.4 Content=STATUS / STATUSDETAILED

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `statusDetails[].updatedAt` | datetime | 状态新鲜度 |
| `…state` | enum | `Scheduled` / `OutGate` / `InAir` / `Landed` / `InGate` / `Canceled` |
| `…equipment.aircraftRegistrationNumber` | string | 机尾号 |
| `…equipment` IATA/ICAO | string | 实际机型（可与计划不一致） |
| 起飞/到达 estimated & actual 时刻 | datetime | 延误分析 |
| `outGateTimeliness` / `inGateTimeliness` | `Early` \| `OnTime` \| `Delayed` | 准点标签 |
| `…variation` | duration | 偏差 |
| `gate` / `checkInCounter` / `baggage` | string | 登机口、值机、行李转盘 |
| `diversionAirport` | string | 备降 |

### 2.5 ExtendedSchedules（若账号开通）

| 字段 | 用途 |
| --- | --- |
| `freightClasses[]` | ULD/托盘等货运舱型提示 |
| `onTimePerformance.*` | 历史准点分档 |
| `restrictions[]`（cargo/passenger） | 载运限制 |
| `bookingClasses[]` | 次要 |

### 2.6 Master Data API

用于把 `aircraftType`、机场码翻译成可读名 / 典型货舱参数（若字典含机型属性）。配额极低 → **启动时缓存到 mock/本地 JSON**。

---

## 3. 数据相关性与衍生指标

下列指标均由「本地申报/运营参数」与「OAG」交叉得出。`null` 输入 → 指标应为 `null` 或 `insufficient_data`，禁止静默当 0。

### 3.1 仅本地即可算（P0，不依赖 OAG）

| 衍生指标 | 公式 / 定义 | 相关性说明 | 建议展示 |
| --- | --- | --- | --- |
| `coverageRate` | `reported / passengerCapacity` | 把现在的「coverage=人数」改成真比例；容量可先用 100，后接 OAG seats | 环形图 |
| `imputedShare` | `imputed / weight` | 补估占比越高，规划可信度越低 | 堆叠条次要色 |
| `knownShare` | `known / weight` | 与上互补 | 同上 |
| `weightUtilization` | `(weight + otherWeight + buffer) / budget` | 重量预算占用率 | 进度条 |
| `spaceUtilization` | `(volume + otherSpace + spaceBuffer) / spaceBudget` | 空间预算占用率 | 进度条 |
| `bindingConstraint` | `argmax(weightUtilization, spaceUtilization)` | **短板约束**（重 or 体） | 标签 |
| `headroomGapKg` | `weightRemaining − baseline` | 预报相对无预报基线多出的规划余量（PRD 叙事 +600 kg） | 瀑布/前后柱 |
| `avgWeightPerReportedPax` | `known / reported`（仅已知部分）或 `weight / reported` | 已报旅客人均行李重 | Stat |
| `avgWeightPerPiece` | `weight / pieces` | 件均重，异常偏高可预警 | Stat |
| `reviewRate` | `reviews / pieces` | 合规风险密度 | 告警 |
| `dataCompleteness` | 有体积申报占比；或 `volume!=null` | 空间余量是否可信 | 徽章 |
| `freshnessMinutes` | `now − max(lastSavedAt, opsUpdatedAt)` | 数据新鲜度 | 页眉 |
| `serviceAttachRate`* | `serviceBags / declaredCheckedBags` | 递送服务渗透（需聚合 orders/items.service） | 漏斗 |
| `cargoDiversionShare`* | Cargo 运输件 / 服务件 | 客机货舱 vs Cargo 分流 | 饼图 |

\* 需把 §1.7 订单数据纳入运营聚合。

### 3.2 接入 OAG 后可算（P1）

| 衍生指标 | 公式 / 定义 | 依赖 OAG | 运营含义 |
| --- | --- | --- | --- |
| `seatCapacity` | `predicted.totalSeats` 或 `actual.totalSeats` | SEATS | 替代硬编码 100 |
| `declarationCoverageVsSeats` | `reported / seatCapacity` | SEATS + 本地 | 真·申报覆盖率 |
| `unreportedSeatGap` | `seatCapacity − reported` | SEATS | 待报座位缺口 |
| `baggageLoadFactorProxy` | `weight / f(cargoTonnage)` 或 `weight / budget` 校准 | `cargoTonnage` | 行李相对货运吨位压力（需单位换算约定） |
| `budgetVsOagTonnageRatio` | `budget / cargoTonnage_kg` | tonnage | 演示预算是否偏离机型能力 |
| `aircraftSwapFlag` | `scheduledAircraft ≠ actualAircraft` | STATUS | 机型变更 → 预算/座位失效风险 |
| `opsConfidence` | 综合：`imputedShare`↓、`dataCompleteness`↑、`!expired`、准点状态 | STATUS + 本地 | 单一「规划可信度」分 |
| `disruptionRisk` | `Delayed`/`Canceled` 或 OTP 低 | STATUS / Extended | 装机窗口压缩 |
| `gateReadinessWindow` | `ETD − now` vs 服务截止 | STATUS + clock | 是否仍接受预报变更 |
| `cabinMixIndex` | 商务+头等座位占比 | SEATS | 高舱旅客行李行为差异（演示假设） |

### 3.3 建议的看板 DTO（聚合后给前端）

前端只消费一个只读对象，例如：

```ts
type OpsDashboardDTO = {
  meta: {
    legId: string;
    scheduleInstanceKey: string | null;
    role: 'admin';
    generatedAt: string;
    source: { plume: 'live' | 'mock'; oag: 'live' | 'mock' | 'disabled' };
    freshnessMinutes: number | null;
  };
  flight: {
    flightNo: string;
    origin: string;
    destination: string;
    departureLocal: string;
    aircraftTypeIata: string | null;
    state: string | null; // OAG status
    seatCapacity: number | null;
    cargoTonnage: number | null;
  };
  declarations: {
    passengerCapacity: number; // seats or demo 100
    reported: number;
    unreported: number;
    coverageRate: number | null; // 0–1
    pieces: number;
    knownKg: number;
    imputedKg: number;
    weightKg: number;
    volumeM3: number | null;
    reviews: number;
  };
  capacity: {
    budgetKg: number | null;
    spaceBudgetM3: number | null;
    otherWeightKg: number | null;
    bufferKg: number | null;
    otherSpaceM3: number | null;
    spaceBufferM3: number | null;
    weightRemainingKg: number | null;
    spaceRemainingM3: number | null;
    baselineRemainingKg: number | null;
    headroomGapKg: number | null;
    weightUtilization: number | null;
    spaceUtilization: number | null;
    bindingConstraint: 'weight' | 'space' | 'unknown';
    expired: boolean;
  };
  derived: {
    imputedShare: number | null;
    avgWeightPerPiece: number | null;
    reviewRate: number | null;
    dataCompleteness: number | null;
    opsConfidence: number | null; // 0–1
    serviceAttachRate: number | null;
  };
  passengers: Array<{
    id: string;
    name: string;
    version: number | null;
    pieces: number | null;
    weightKg: number;
    source: 'user_estimate' | 'system_imputed' | 'unreported';
    review: boolean;
  }>;
  alerts: Array<{ code: string; severity: 'info' | 'warn' | 'critical'; messageKey: string }>;
};
```

---

## 4. 前后端分离与 Mock 操作建议

现状是静态多页 + `localStorage`；`tools/serve.py` 已有 **演示级** `/api/handover/tracking`。运营看板升级应沿同一 BFF 模式扩展，而不是让浏览器直连 OAG（密钥与配额不安全、也不利 mock）。

### 4.1 推荐目录与职责

```text
tools/
  serve.py                 # 开发服务器：静态站点 + /api/*
  mock/
    oag/
      cx257-2026-11-15.json   # Flight Info 录制/手写响应
      master-aircraft.json    # Master Data 缓存
    plume/
      declarations.json       # 可选：服务端演示申报
  ops_aggregate.py            # 纯函数：declarations+ops+oag → OpsDashboardDTO
pages/operations.html         # 管理员页：fetch DTO 后渲染
assets/ops-dashboard.js       # （可选拆分）只负责展示
```

### 4.2 API 草图

| Method | Path | 说明 |
| --- | --- | --- |
| `GET` | `/api/ops/dashboard?legId=CX257-20261115` | 返回 `OpsDashboardDTO`；要求 admin |
| `GET` | `/api/ops/health` | plume / oag 数据源状态 |
| `POST` | `/api/ops/params` | （演示）更新 budget 等；写回 mock 或内存 |
| `GET` | `/api/oag/flight-instances?...` | BFF 代理 OAG（生产）；开发默认读 mock |

鉴权演示：

- Header `X-Demo-Role: admin` → 200  
- 缺失或 `traveller` → 403（页面提示无权限）

### 4.3 数据源切换（环境变量）

| 变量 | 值 | 行为 |
| --- | --- | --- |
| `OPS_DATA_MODE` | `mock`（默认） | 全部走 `tools/mock/**` |
| | `hybrid` | 申报用本地/浏览器同步；航班用 OAG live |
| | `live` | OAG + 服务端申报存储 |
| `OAG_API_KEY` | secret | 仅服务端；前端永不持有 |
| `OAG_BASE_URL` | `https://api.oag.com` | |

**配额保护**：Flight Info 1000/30 天 → mock 为默认；live 响应写入 `tools/mock/oag/` 作录像，避免重复打满。

### 4.4 聚合边界（关键）

1. **浏览器**不再调用 `forecastCapacity()` 作为权威结果；可保留同名纯函数作单测对照。  
2. **服务端** `ops_aggregate` 实现与 `model.js` 相同公式，用 `tools/tests` 锁住。  
3. OAG 失败时：DTO.`source.oag='disabled'`，座位/机型/状态置 `null`，本地规划指标仍可用。  
4. 管理员页与旅客页共享申报真相源，避免两套写死数字（PRD 要求）。

### 4.5 前端渲染策略

| 阶段 | 做法 |
| --- | --- |
| Phase A | 仍用现有 `opsHTML`，但数字改为 `fetch('/api/ops/dashboard')` |
| Phase B | 按 DTO 重做信息架构：决策层（双余量+覆盖率+alerts）→ 构成层 → 明细表 |
| Phase C | 接入 OAG 衍生指标与机型/延误条 |

### 4.6 Mock 最小飞行响应（字段级）

`tools/mock/oag/cx257-2026-11-15.json` 建议至少包含：

- `carrier=CX`, `flightNumber=257`
- `departure/arrival` HKG→LHR + 时刻
- `aircraftType.iata`（如宽体代码）
- `cargoTonnage`
- `seatingCapacity.predicted.totalSeats`（例如 350，用于对比旧的 100 人演示口径——**需在文档中说明演示人数与座位的映射策略**）
- `statusDetails[0].state=Scheduled`, `outGateTimeliness=OnTime`

> 注意：当前演示「100 名乘机人」是产品叙事数字，不等于 OAG 座位数。接入后应显式字段：`demoPassengerUniverse=100` vs `seatCapacity=OAG`，避免覆盖率语义混乱。

---

## 5. 实施优先级（整理看板时的建议顺序）

1. **P0 — 数据契约**：落地 `OpsDashboardDTO` + mock JSON + `/api/ops/dashboard` + admin 403。  
2. **P0 — 清单可视化**：覆盖率真比例、known/imputed 构成、双利用率与 `bindingConstraint`、alerts。  
3. **P1 — 本地增值**：订单/服务渗透、Cargo 分流、交接完成率进入看板。  
4. **P1 — OAG mock**：座位、机型、`cargoTonnage`、状态；算 §3.2 指标。  
5. **P2 — OAG live 代理**：密钥只在服务端；录制回放；Master Data 缓存。

---

## 6. 开放问题（需产品拍板）

1. 覆盖率分母用 **演示 100 人** 还是 **OAG 座位**？还是两者并列？  
2. `cargoTonnage` 与现行 `budget`（kg）的单位换算与安全系数？  
3. 管理员鉴权：仅 demo header，还是简单口令 / 独立入口路径？  
4. 旅客 `localStorage` 申报如何同步到 BFF（postMessage / 显式「同步到运营」按钮 / 服务端会话）？

---

## 7. 参考

- 本地：`assets/model.js`（`demand` / `aggregateBaggage` / `forecastCapacity`）、`assets/app.js`（`opsHTML`）  
- PRD：`doc/Plume_Light_PRD.md` §08 OPS01–OPS03  
- OAG Hackathon Guide（上传 PDF）  
- OAG：[Response Layout](https://knowledge.oag.com/docs/flight-info-api-response-layout-descriptions)、[Content Parameters](https://knowledge.oag.com/docs/flight-info-api-content-parameters)

---

*文档版本：2026-11-07（Asia/Shanghai）· 只读梳理，未改运营页实现。*
