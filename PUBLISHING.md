Publishing
===

## Releasing a new version

1. Make sure you have the latest from the main branch:

       git pull origin master

2. Update `changelog.md` with the changes since the last release, then commit:

       git add changelog.md
       git commit -m 'update changelog for x.y.z'

4. Set the release version (updates `package.json` and `package-lock.json`, creates a commit and a git tag):

       npm version x.y.z

5. Push the commit and tag:

       git push --follow-tags

6. The tag push triggers two GitHub Actions workflows:
   - **publish.yml** — publishes to npm using [trusted publishing with OIDC](https://docs.npmjs.com/trusted-publishers) (no token required, provenance is automatic)
   - **release.yml** — drafts a GitHub release with `dist.zip` attached (contains the full `dist/` directory)

7. Go to the [GitHub releases page](https://github.com/proj4js/proj4js/releases), review the draft release, edit the notes if needed, and publish it.

8. Update the version to the next pre-release:

       npm version x.y.(z+1)-alpha --no-git-tag-version
       git add package.json package-lock.json
       git commit -m 'update version to x.y.(z+1)-alpha'
       git push origin master
