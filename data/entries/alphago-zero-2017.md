---
id: alphago-zero-2017
type: event
title: "AlphaGo Zero 从零自我对弈"
title_en: "Mastering the game of Go without human knowledge"
date: "2017-10-18"
importance: 8
categories: [agent, model]
summary: "DeepMind 在 Nature 发表 AlphaGo Zero：不使用任何人类棋谱，仅从围棋规则出发做自我对弈强化学习，训练三天后以 100:0 击败此前的 AlphaGo。"
significance: "AlphaGo Zero 把「从零自我对弈」做成可行范式，证明在规则明确的领域，纯强化学习可以超越人类数据设定的上限。它直接催生了 AlphaZero 在围棋、国际象棋、将棋上的通用化尝试，也强化了「合成数据 + 搜索 + 自我博弈」的路线信念。"
quote: ""
speaker: ""
occasion: ""
my_comment: "「不需要人类知识」是这篇论文最激进的断言，也是它最深远的影响。"
tags: [alphago-zero, self-play, reinforcement-learning, go, deepmind]
sources:
  - "https://www.nature.com/articles/nature24270"
relations:
  - to: alphago-2016
    type: 基于
    note: "在 AlphaGo 的深度强化学习 + MCTS 范式上，去掉人类棋谱与手工特征做纯自我对弈"
mainline: true
needs_review: false
node_kind: model
---
