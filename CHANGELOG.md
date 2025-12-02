# 変更履歴 (Changelog)

## フォーク変更履歴 (u5-1784/claude-code-action)

このリポジトリは公式Claude Code Actionをフォークしたもので、OAuth認証サポートとrepository_dispatch対応を追加しています。

### [2025-12-02] repository_dispatch対応とPAT権限チェック改善

#### 追加 (Added)
- **repository_dispatchでのactor情報取得**: `client_payload.actor`から実際のユーザー情報を取得
  - Turn間でIssue作成者の情報を引き継げるように改善
  - fallback機能: `client_payload.actor`がない場合は`context.actor`を使用

#### 修正 (Fixed)
- **PAT権限チェックの改善**: repository_dispatchイベント時の権限検証を修正
  - `github-actions[bot]`の場合、トークン自体の権限をテストする方式に変更
  - アクターベースではなくトークンベースの権限チェックで正確な検証を実現
  - Organization リポジトリでのPAT使用時のエラーを解消

#### 変更内容の詳細

**src/github/context.ts**
```typescript
case "repository_dispatch": {
  const originalActor = (dispatchPayload.client_payload as any)?.actor;
  return {
    ...commonFields,
    actor: originalActor || context.actor,  // client_payloadのactorを優先
    // ...
  };
}
```

**src/github/validation/permissions.ts**
```typescript
if (context.eventName === 'repository_dispatch' && actor === 'github-actions[bot]') {
  // トークン自体の権限をテスト
  await octokit.repos.get({ owner, repo });
  return true;
}
```

#### 影響範囲
- repository_dispatchイベントを使用するマルチターンワークフローで正常動作
- 既存の他イベント（issues, pull_request等）への影響なし
- 後方互換性を維持

---

## オリジナルフォーク変更 (Akira-Papa/claude-code-action@beta)

このフォークは公式Claude Code ActionにOAuth認証サポートを追加したものです。

### 追加機能 (Added)

- **OAuth認証サポート**: Claude Max購読者がGitHub ActionsでClaudeを使用可能
  - 新規入力: `use_oauth` - OAuth認証を有効化
  - 新規入力: `claude_access_token` - Claude Max購読のOAuthアクセストークン
  - 新規入力: `claude_refresh_token` - OAuthリフレッシュトークン
  - 新規入力: `claude_expires_at` - トークン有効期限タイムスタンプ
- **ベースアクション更新**: OAuth認証を含む`Akira-Papa/claude-code-base-action@beta`を使用

### 変更内容 (Changed)

- アクション名を "Claude Max Code Action (OAuth Fork)" に更新
- READMEにOAuthセットアップ手順を追加
- すべてのサンプルをフォークアクション用に更新

### OAuth使用方法

1. Claude Max購読からOAuth認証情報を取得
2. GitHub Secretsに認証情報を追加:
   - `CLAUDE_ACCESS_TOKEN`
   - `CLAUDE_REFRESH_TOKEN`
   - `CLAUDE_EXPIRES_AT`
3. ワークフローでOAuthを有効化:
   ```yaml
   - uses: u5-1784/claude-code-action@main
     with:
       use_oauth: "true"
       claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
       claude_refresh_token: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
       claude_expires_at: ${{ secrets.CLAUDE_EXPIRES_AT }}
   ```

### 互換性 (Compatibility)

このフォークは元のアクションとの完全な後方互換性を維持しています。既存のワークフローは変更なしで動作します。OAuthは既存の認証方式（APIキー、Bedrock、Vertex AI）に加えて選択できる追加オプションです。 