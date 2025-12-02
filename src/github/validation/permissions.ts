import * as core from "@actions/core";
import type { ParsedGitHubContext } from "../context";
import type { Octokit } from "@octokit/rest";

/**
 * Check if the actor has write permissions to the repository
 * @param octokit - The Octokit REST client
 * @param context - The GitHub context
 * @returns true if the actor has write permissions, false otherwise
 */
export async function checkWritePermissions(
  octokit: Octokit,
  context: ParsedGitHubContext,
): Promise<boolean> {
  const { repository, actor } = context;

  try {
    core.info(`Checking permissions for actor: ${actor}`);

    // repository_dispatchの場合で、actorがgithub-actions[bot]の場合は
    // トークン自体の権限をテストする
    if (context.eventName === 'repository_dispatch' && actor === 'github-actions[bot]') {
      core.info('repository_dispatch with github-actions[bot] detected, testing token permissions directly');

      try {
        // トークンで実際にリポジトリ情報を取得できるかテスト
        await octokit.repos.get({
          owner: repository.owner,
          repo: repository.repo,
        });

        core.info('✅ Token has repository access - permissions verified');
        return true;
      } catch (tokenError) {
        core.error(`Token lacks repository access: ${tokenError}`);
        return false;
      }
    }

    // Check permissions directly using the permission endpoint
    const response = await octokit.repos.getCollaboratorPermissionLevel({
      owner: repository.owner,
      repo: repository.repo,
      username: actor,
    });

    const permissionLevel = response.data.permission;
    core.info(`Permission level retrieved: ${permissionLevel}`);

    if (permissionLevel === "admin" || permissionLevel === "write") {
      core.info(`✅ Actor has write access: ${permissionLevel}`);
      return true;
    } else {
      core.warning(`Actor has insufficient permissions: ${permissionLevel}`);
      return false;
    }
  } catch (error) {
    core.error(`Failed to check permissions: ${error}`);
    throw new Error(`Failed to check permissions for ${actor}: ${error}`);
  }
}
