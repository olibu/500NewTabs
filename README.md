# 500 New Tabs

Chrome Extension to show pretty background images in new tabs from the 500px.com web page.

# Why another extension?

There are already a lot of such extensions. I've used [Moment](https://chrome.google.com/webstore/detail/moment-1-personal-dashboa/lgecddhfcfhlmllljooldkbbijdcnlpe) for a very long time. 500px.com has [it's own extension](https://chrome.google.com/webstore/detail/500px-photo-new-tab-inspi/clbaflfnbbbgjppjogdmnhkgpiijamdg) already. And even the default Chrome New Tab pages shows nice pictures.

So, why another extension?

There are a lot of backend requests including some intransparent analytics procedures in Moment. It is closed source with a lot of functionality inside. If you take a look at the local session store of that extension you will see what I mean. However, if you want to have a high quality app, which provides a payed pro mode, I would stick to this extension.

The 500px extension worked fine for me, but I don't like the huge watermark and the missing offline functionality and the slow loading images. I would not suggest to use it at all.

The default page is, how to say? The default page. The pictures are nice and it works, but I don't like it. It is not a clean layout in my opinion.

# Functionality

* The last cached image is shown as new tab background image
* A new image will be downloaded form 500px in case of
  * If the image is older than 1 hour
  * If the image has been shown for the 10th time 

# Future Features

* Caching of multiple images
* Link to 500px page
* Customization of the page via options
* Customization of the query via options

## Disclaimer

This extension is no afilitate with Goolge, 500px.com or any other pice of software mentioned at this site. It may stop working as soon a the backend API used by the 500px web page change.

## License

500NewTabs is licensed under the [MIT License](https://tldrlegal.com/l/mit)