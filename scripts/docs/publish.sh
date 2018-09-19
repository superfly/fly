if [ -z ${npm_package_version} ]; then
pwd
  npm_package_version=`node -p "require('./lerna.json').version"`;
fi
echo "prepping docs clone: $npm_package_version"
rm -rf ./dist/docs/
mkdir -p ./dist/
git clone https://github.com/superfly/fly.docs.git ./dist/docs/ -q
pushd ./packages/v8env/
  yarn docs
popd
pushd ./dist/docs/
current_repo=$(git config --get remote.origin.url)
if [ "$current_repo" != "https://github.com/superfly/fly.docs.git" ]; then
  echo "wrong repo: $current_repo"
  exit 1
fi
git add -A .
git commit -m "v$npm_package_version"
git tag -f -a v$npm_package_version -m "version $npm_package_version"
git push origin v$npm_package_version
popd