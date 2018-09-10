echo "prepping docs clone"
rm -rf docs/
git clone https://github.com/superfly/fly.docs.git docs/ -q
./node_modules/typedoc/bin/typedoc --tsconfig ./v8env/tsconfig.json --gitRevision v$npm_package_version > /dev/null
pushd docs/
current_repo=$(git config --get remote.origin.url)
if [ "$current_repo" != "https://github.com/superfly/fly.docs.git" ]; then
  echo "wrong repo: $current_repo"
  exit 1
fi
git add -A .
git commit -m "v$npm_package_version"
git tag -f -a v$npm_package_version -m "version $npm_package_version"
git push origin master -f --follow-tags
popd