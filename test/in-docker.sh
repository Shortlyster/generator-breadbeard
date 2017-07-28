rm -rf breadbeard_test

echo "> yo breadbeard breadbeard_test"
yo breadbeard breadbeard_test --skip-install

pushd ./breadbeard_test

# echo "> yo breadbeard:auth"
# yo breadbeard:auth --skip-install
# adding the auth dependnecies without installing it
# sed "s/\(\(^[ ]*\)\"express\":\s*[^,]*,\)/\1\\
# \2\"express-jwt\": \"^5.0.0\",/" <package.json >package.json.updated
# mv package.json.updated package.json
# sed "s/\(\(^[ ]*\)\"express\":\s*[^,]*,\)/\1\\
# \2\"shortlyster-password\": \"^1.0.2\",/" <package.json >package.json.updated
# mv package.json.updated package.json

echo "> yo breadbeard:resource green_apple"
yo breadbeard:resource green_apple --skip-install

echo "> yo breadbeard:resource CoolBananas --no-timestamps"
yo breadbeard:resource CoolBananas --skip-install --no-timestamps

echo "> yo breadbeard:migration TabsToSpaces"
yo breadbeard:migration TabsToSpaces

# docker-compose build
docker-compose down

echo "> migrate up"
docker-compose run app bin/migrate up

echo "> migrate list"
docker-compose run app bin/migrate list

echo "> migrate rollback"
docker-compose run app bin/migrate rollback

echo "> npm test"
docker-compose run app npm test

echo "> npm run lint"
docker-compose run app npm run lint

docker-compose down

popd
rm -rf breadbeard_test
