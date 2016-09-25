import {
  Directive,
  ElementRef,
  Input,
  HostBinding,
  Renderer,
  AfterViewInit,
  OnDestroy,
  NgZone
} from '@angular/core';

// Keep an eye on this. Should eventually be able to animate show/hide.
// https://github.com/apache/cordova-plugin-statusbar/pull/37
import { StatusBar } from 'ionic-native';

import {
  // Platform,
  Content
} from 'ionic-angular';

@Directive({
  selector: '[shrinkage]'
})
export class Shrinkage implements AfterViewInit, OnDestroy{

  // TODO: Consider measuring the content to see if it's worth activating.
  // Or just leave it up to devs to decide which pages for which it's necessary.

  // Maybe reset with exportAs - http://stackoverflow.com/a/36345948/1341838

  // TODO: Handle screen resizes

  private headerHeight: number;
  private lastScrollTop: number = 0;
  private lastHeaderTop: number = 0;

  // I'm using this because I don't know when the different platforms decide
  // if StatusBar.isVisible is true/false; is it immediate or after animation?
  // It also prevents ongoing console warnings about Cordova.
  private isStatusBarShowing: boolean = true;

  private pauseForBarAnimation: boolean = false;
  private pauseForBarDuration = 500;
  private pauseForBarTimeout: Function;

  // private savedConDim;

  // render vars so we aren't scoping new ones each time
  private scrollTop = 0;
  private contentHeight = 0;
  private scrollHeight = 0;
  private scrollChange = 0;
  private pastBottom: boolean;
  private lastTopFloored = 0;

  /**
   * TODO: Make this parallax value a set-able directive?
   * 
   * showParallaxFactor is the rate at which the header comes back into view.
   * Then there's a hideParallaxFactor (which is always a slower rate).
   * This guarantees that, even with whatever rounding that might happen, the
   * header will be able to come completely back into view.
   * 
   * But from a UX standpoint, showing the header (and other controls) is a
   * more important end than hiding them; hiding them is a bonus to have
   * more screen real estate, but showing them is a necessity to interact with
   * the app. Bringing back the controls into view might be the specific purpose
   * of the scroll action. A quicker show animation addresses this,
   * while keeping a more gradual, puroposful, and noticeable hiding animation. 
   */

  private showParallaxFactor = 0.7;
  private hideParallaxFactor = this.showParallaxFactor * 0.6;

  // Might end up separate shrinkageHeader, shrinkageFooter
  @Input('shrinkage') content: Content;

  constructor(
    private el: ElementRef,
    private renderer: Renderer,
    // private platform: Platform,
    private zone: NgZone
  ) {}

  ngAfterViewInit() {

    // Call to init values.
    this.resize();

    // Kick of rendering
    this.render(null);

    // console.log("ngAfterViewInit in Directive");

    // This listener only updates values. It doesn't do any rendering.
    this.content.addScrollListener((event) => {
      this.onPageScroll(event);
    });


    // TODO: When I look at doing footers & toolbars, grab the localName to see
    // what it is and move it accordingly.
    // console.log("this ne", this.el.nativeElement.localName);
    // console.log("this in ngAfterViewInit", this);

    // this.content.onScrollEnd((event)=>{this.onEnd(event)});
  }

  ngOnDestroy() {
    // I expected a removeScrollListenter method on content.
    // Maybe it cleans up after itself.

    // cancelAnimationFrame(this.rAFInt);
  }

  resize() {
    // clientHeight and offsetHeight ignore bottom shadow in measurment
    this.headerHeight = this.el.nativeElement.scrollHeight;

    // this.savedConDim = this.content.getContentDimensions();
    // console.log(`savedConDim`, this.savedConDim);

    // setTimeout(() => {
    //   this.savedConDim = this.content.getContentDimensions();
    //   console.log(`savedConDim2`, this.savedConDim);
    // }, 500);

    // console.info(`resized: new height = `, this.headerHeight);
  }

  render(ts) {

    // Need a better example of doing this with a zone. This doesn't appear to
    // improve things. Maybe we'll get some magic improvments with Beta.12.
    // this.zone.runOutsideAngular(() => {
    //   requestAnimationFrame(this.move.bind(this));
    // });

    // requestAnimationFrame(this.move.bind(this));
    // windo.rAF seems the same
    requestAnimationFrame(ts => this.render(ts));
    
    this.calculateRender(ts);

  }

  get showingHeight(): number {
    return this.headerHeight - this.lastHeaderTop;
  }


  // private onEnd(event){
  //   console.log("end?");
  //   // If this worked, I could start an interval here for momemtum. This isn't
  //   // an issue on WK, only UI. Follow this bug if I care about fixing for UI:
  //   // https://github.com/driftyco/ionic/issues/5549
  // }


  private onPageScroll(event) {
    // console.log(`e`, event.target.scrollTop);
    this.scrollTop = event.target.scrollTop;

    // This might not work and still might have to use savedConDim bc
    // clientHeight might not account for ionic footers and such.
    this.contentHeight = event.clientHeight;
    
    this.scrollHeight = event.scrollHeight;
  }


  calculateRender(timestamp) {

    // Gotta be > 0 otherwise we aren't scrolling yet, or are rubberbanding.
    // If scrollTop and lastScrollTop are the same, we've stopped scrolling
    // and no need for calculations
    if(this.scrollTop >= 0 && this.scrollTop !== this.lastScrollTop) {

      // Obvious
      this.scrollChange = this.scrollTop - this.lastScrollTop;

      // Update for next loop
      this.lastScrollTop = this.scrollTop;

      // This is whether we are rubberbanding past the bottom
      this.pastBottom = this.contentHeight + this.scrollTop > this.scrollHeight;

      // GOING UP
      if (this.scrollChange > 0) {


        if (this.isStatusBarShowing && !this.pauseForBarAnimation) {
          // StatusBar.isVisible
          this.isStatusBarShowing = false;
          StatusBar.hide();
        }

        // Shrink the header with the slower hideParallaxFactor
        this.lastHeaderTop += (this.scrollChange * this.hideParallaxFactor);

        // The header only moves offscreen as far as it is tall. That leaves
        // it ready to immediately scroll back when needed.
        if (this.lastHeaderTop >= this.headerHeight) {
          this.lastHeaderTop = this.headerHeight;
        }

        // console.group(`/\\ Going UP /\\`);
        //   console.log(`scrollChange`, this.scrollChange);
        //   console.log(`scrollTop`, this.scrollTop);
        //   console.log(`lastTop`, this.lastHeaderTop);
        // console.groupEnd();


      // GOING DOWN
      } else if (this.scrollChange < 0 && !this.pastBottom) {

        /**
         * The combination of scrollChange < 0 && !pastBottom has to do with
         * the return movement of the rubberbanding effect after you've scrolled
         * all the way to the bottom (UP), and after releasing the elastic
         * is bringing it back down. This allows you to reach the bottom, and
         * push the header away without it sneaking back.
         */

        // Is 40 the right height (for iOS)? If it shows too early it looks weird.
        // When animation is available, it will look better too.
        if (!this.isStatusBarShowing && this.showingHeight > 40) {
          // !StatusBar.isVisible

          if (!this.pauseForBarAnimation) {
            
            this.pauseForBarAnimation = true;
            this.isStatusBarShowing = true;
            StatusBar.show();
            
            setTimeout(() => {
              this.pauseForBarAnimation = false;
            }, this.pauseForBarDuration);

          }

        }

        // Reveal the header with the faster showParallaxFactor 
        this.lastHeaderTop += (this.scrollChange * this.showParallaxFactor);

        // The header can't go past (greater) zero. We should never see any
        // gaps above the header, even when rubberbanding.
        if (this.lastHeaderTop <= 0) {
          this.lastHeaderTop = 0;
        }

        // console.group(`\\/ Going DOWN \\/`);
        //   console.log(`scrollChange`, this.scrollChange);
        //   console.log(`scrollTop`, this.scrollTop);
        //   console.log(`lastTop`, this.lastHeaderTop);
        // console.groupEnd();


      } else {
        // prevented by scrollTop !== lastScrollTop above, shouldn't happen
        console.log("going NOWHERE", this.scrollChange, this.scrollTop);
        // cancelAnimationFrame?
      }

      // Use floor to prevent line flicker between ion-navbar & ion-toolbar.
      // this.lastTopFloored = Math.floor(this.lastHeaderTop);
      // Double tilde is a bitwize version of floor that is a touch faster:
      // https://youtu.be/O39OEPC20GM?t=859
      this.lastTopFloored = ~~this.lastHeaderTop;

      // this.renderer.setElementStyle(this.el.nativeElement, 'transform', `translateY(${-lastTopFloored}px)`);
      // this.el.nativeElement.style.transform = `translate3d(0, ${-this.lastTopFloored}px ,0)`;
      this.renderer.setElementStyle(this.el.nativeElement, 'transform', `translate3d(0, ${-this.lastTopFloored}px ,0)`);

    } else {
      // Don't do anything here since we are rubberbanding past the top.
    }

  }


}