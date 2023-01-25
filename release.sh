#!/bin/sh

##########################################################################################
# This is the build script to create a release zip file to be uploaded to the chrome store
##########################################################################################
# ./release.sh <release tag>
#
# Example: ./release.sh v1.0.0
##########################################################################################
# Prerequisits
# - a tag for the release is already availble in git
# - jq is installed
##########################################################################################

release=$1
tag="V"$release

if [ -z "$release" ]
then
    echo "Missing release tag"
    exit 1
fi

echo "creating release '"$release"' by tag $tag"

# ensure the availability of the tag in git
tagIdentifier=`git --no-pager log --pretty=oneline -n 1 --decorate | grep "tag: "$tag | wc -l`
if [ $tagIdentifier != 1 ]
then
    echo "Tag $tag is currently not checked out"
    echo "git checkout $tag"
    exit 1
fi

# build the release
npm run build
jq '.version="'$release'"'  dist/manifest.json > dist/manifest2.json
mv dist/manifest2.json dist/manifest.json
cd dist
find . -name ".DS_Store" -delete 
zip -r ../releases/500NewTabs_$tag.zip ./ 