rm -rf redbeard_test

echo "> yo redbeard redbeard_test"
yo redbeard redbeard_test --skip-install

pushd ./redbeard_test

echo "> yo redbeard:auth"
yo redbeard:auth --skip-install
# adding the auth dependnecies without installing it
sed "s/\(\(^[ ]*\)\"express\":\s*[^,]*,\)/\1\\
\2\"express-jwt\": \"^5.0.0\",/" <package.json >package.json.updated
mv package.json.updated package.json
sed "s/\(\(^[ ]*\)\"express\":\s*[^,]*,\)/\1\\
\2\"simple-password\": \"^1.0.1\",/" <package.json >package.json.updated
mv package.json.updated package.json

echo "> yo redbeard:resource green_apple"
yo redbeard:resource green_apple --skip-install

echo "> yo redbeard:resource CoolBananas --no-timestamps"
yo redbeard:resource CoolBananas --skip-install --no-timestamps

echo "> yo redbeard:migration TabsToSpaces"
yo redbeard:migration TabsToSpaces

docker-compose down

echo "> migrate up"
docker-compose run redbeard_test bin/migrate up

echo "> migrate list"
docker-compose run redbeard_test bin/migrate list

echo "> migrate rollback"
docker-compose run redbeard_test bin/migrate rollback

echo "> npm test"
docker-compose run redbeard_test npm test

echo "> npm run lint"
docker-compose run redbeard_test npm run lint

# docker-compose down

popd
rm -rf redbeard_test
