# Fork Changes

このドキュメントは、[Akira-Papa/claude-code-action](https://github.com/Akira-Papa/claude-code-action)からフォークした後に追加された独自の変更を記録します。

## 📋 目的

- upstream（フォーク元）との差分を明確に管理
- 今後のupstream更新時に競合を予測
- チームメンバーへの変更内容の共有
- 独自変更が失われないように記録

---

## 📝 変更履歴

### 2025-12-02: repository_dispatch イベント対応

**コミット:**
- `187739f` - feat: repository_dispatchイベント対応を追加
- `a1472d6` - docs: repository_dispatchイベント対応をREADMEに追記

**変更ファイル:**
- `src/github/context.ts`
- `README.md`

**変更内容:**

#### 1. `src/github/context.ts`

**追加した型定義:**
```typescript
import type {
  // ...
  RepositoryDispatchEvent,  // 追加
} from "@octokit/webhooks-types";

export type ParsedGitHubContext = {
  // ...
  payload:
    | IssuesEvent
    | IssueCommentEvent
    | PullRequestEvent
    | PullRequestReviewEvent
    | PullRequestReviewCommentEvent
    | RepositoryDispatchEvent;  // 追加
  // ...
};
```

**追加したイベントハンドラ:**
```typescript
case "repository_dispatch": {
  // repository_dispatchイベントからissue_numberを取得
  const dispatchPayload = context.payload as RepositoryDispatchEvent;
  const issueNumber = (dispatchPayload.client_payload as any)?.issue_number;

  if (!issueNumber) {
    throw new Error(
      "repository_dispatch event requires client_payload.issue_number",
    );
  }

  return {
    ...commonFields,
    payload: dispatchPayload,
    entityNumber: parseInt(String(issueNumber)),
    isPR: false, // repository_dispatchでは基本的にissueとして扱う
  };
}
```

**追加した型ガード関数:**
```typescript
export function isRepositoryDispatchEvent(
  context: ParsedGitHubContext,
): context is ParsedGitHubContext & { payload: RepositoryDispatchEvent } {
  return context.eventName === "repository_dispatch";
}
```

#### 2. `README.md`

- サポートイベント一覧で`repository_dispatch`を「coming soon」→「✅ supported」に更新
- 新セクション「Multi-Turn Workflow with Repository Dispatch」を追加
  - ワークフロー例
  - GitHub API経由でのトリガー方法
  - 必須要件と制限事項
  - ユースケース

**背景:**
- notehub-infraのマルチターンワークフロー（Turn 2-5 → Turn 1）で必要
- GitHub API経由で`repository_dispatch`イベントを送信し、Turn 1ワークフローをトリガー
- `client_payload.issue_number`でissue番号を渡す設計

**技術的詳細:**
- `repository_dispatch`イベントは`client_payload`で任意のデータを渡せる
- 最大10個のトップレベルプロパティ、最大65,535文字の制限あり
- イベントはデフォルトブランチでのみトリガー可能

**upstreamへのPR予定:**
- **未定**（独自要件のため様子見）
- upstreamが同様の機能を追加した場合は、upstream実装を優先して採用

**競合リスク:**
- **高リスク:** `src/github/context.ts`の`parseGitHubContext()`関数
  - switch文に新しいcaseを追加しているため、upstreamが同じ箇所を変更すると競合
  - 特に、他のイベントタイプを追加した場合は確実に競合
- **中リスク:** `ParsedGitHubContext`型定義
  - payloadユニオン型に追加しているため、upstreamが型を変更すると競合の可能性
- **低リスク:** `README.md`
  - ドキュメントの追記なので、競合しても解決は容易

**競合時の対応方針:**
1. upstreamが`repository_dispatch`サポートを追加した場合
   - → upstream実装を優先採用
   - → 独自実装は削除
   - → 動作確認後、notehub-infraで問題なければ移行完了

2. upstreamが関係ない変更をした場合
   - → 慎重にマージ
   - → 独自の`repository_dispatch`ケースを必ず保持
   - → テスト必須（`npm run typecheck`）

3. 競合解決に自信がない場合
   - → upstream変更をいったん見送る
   - → 必要に応じて後日対応
   - → 現バージョンで安定動作していれば急ぐ必要なし

---

## 🔄 管理方針

### upstream同期時のチェックリスト

upstream更新を同期する際は、以下を確認してください：

- [ ] `git fetch upstream`でupstreamを取得
- [ ] `git log HEAD..upstream/main`で変更内容を確認
- [ ] `git diff HEAD..upstream/main -- src/github/context.ts`で競合リスクを評価
- [ ] 競合がある場合は、このドキュメントの「競合時の対応方針」を参照
- [ ] 同期ブランチ（`upstream-sync-YYYYMMDD`）で作業
- [ ] マージ後、必ず`npm run typecheck`を実行
- [ ] notehub-infraで実際のworkflowをテスト
- [ ] 問題なければmainにマージ

### upstreamへの貢献

将来的に、以下の条件を満たせばupstreamにPRを送ることを検討：

- repository_dispatch対応が一般的なユースケースであることが確認できた
- 実装が安定し、notehub-infraで十分にテストされている
- upstreamコミュニティで需要がありそう

**メリット:**
- 採用されれば、今後の独自管理が不要になる
- コミュニティに貢献できる
- 長期的なメンテナンスコストの削減

---

## 📚 関連ドキュメント

### このフォーク
- Repository: https://github.com/u5-1784/claude-code-action
- 自動チェックワークフロー: [.github/workflows/check-upstream.yml](.github/workflows/check-upstream.yml)

### upstream（フォーク元）
- Repository: https://github.com/Akira-Papa/claude-code-action
- 定期的にチェックして、重要な更新を見逃さないようにする

### notehub-infra（利用側）
- Repository: https://github.com/org-notehub/notehub-infra
- マルチターンワークフロー: `.github/workflows/claude-turn*.yml`
- Issue #15: repository_dispatch対応が必要だった背景

---

## 🤝 貢献者

このフォークへの貢献者：

- **u5-1784** - repository_dispatch対応の実装

---

**最終更新:** 2025-12-02
