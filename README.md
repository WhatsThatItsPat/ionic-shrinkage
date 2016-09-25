# ionic-shrinkage

***ionic-shrinkage*** is a directive for Ionic 2 to cause headers to shrink & reveal, in parallactic fashion, based on user scrolling.

![I was in the pool](i-was-in-the-pool.gif)

## Installation

```bash
npm install ionic-shrinkage --save
```

## Usage Example

### home.ts

```typescript
import { Component, ViewChild } from '@angular/core';
import { Content } from 'ionic-angular';
import { Shrinkage } from 'ionic-shrinkage';

@Component({
  templateUrl: 'build/pages/home/home.html',
  directives: [ Shrinkage ]
})
export class HomePage {
  // We bind content to the shrinkage attribute in the HTML template
  @ViewChild(Content) content: Content;

  // Necessary for the change() method below
  @ViewChild(Shrinkage) shrinkage;

  constructor() {}

  // If you use Structural Directives to add or remove items in the header,
  // you'll have to call resize() on both content and the shrinkage directive.
  change(e) {
    this.content.resize();
    this.shrinkage.resize();
  }
}
```

### home.html

```html
<ion-header [shrinkage]="content">

  <ion-navbar>
    <ion-title>I was in the pool!</ion-title>
  </ion-navbar>

  <!--Structural Directives need to be accounted for with the resize() method --> 
  <ion-toolbar no-border-top *ngIf="showSearch">
    <ion-searchbar></ion-searchbar>
  </ion-toolbar>

</ion-header>


<!--Note the fullscreen attribute-->
<ion-content class="home" fullscreen>

  <!--Enough content to scroll-->

  <ion-item>
    <ion-label>Search</ion-label>
    <!--change() will resize the content and header via the directive-->
    <ion-toggle [(ngModel)]="showSearch" (ionChange)="change()"></ion-toggle>
  </ion-item>

</ion-content>
```

## Requirements & Notes

* WKWebView - With UIWebView, scroll events don't continue firing after your finger has left the screen, and while scroll momentum is still in effect. This works in WKWebView.
* Crosswalk - I looked at Android without Crosswalk for about 2 minutes and doubt I'll spent more that that.
* Windows? - I don't know and haven't tested it at all.


## TODO

1. ~~Resize method.~~
2. Improve performance or provide fallback animation / cancellation for older devices.
   * Shrinkage works like butter on an iPhone 6s, but is janky on iPhone 5 and Galaxy S3 (with Crosswalk). Though both of those devices are from 2012, and possibly not worth fussing about.
   * Perfomance advice and device testing are welcome.
3. Hide footers & tabs.
4. Consider independently hiding toolbars within a header.


## Author

[Patrick McDonald](https://patrickmcd.com) ([Github](https://github.com/patrickmcd) / [Twitter](https://twitter.com/WhatsThatItsPat))

## Licence

This project is licensed under the ISC license. See the [LICENSE](LICENSE.md) file for more info.