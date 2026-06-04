{
    // ================================================
    // RESPONSIVE PORTFOLIO JS - MOBILE OPTIMIZED
    // fabioqueiros.com
    // 
    // CRITICAL: All animation timings, easing functions,
    // and delays preserved from original.
    // Mobile optimizations added.
    // ================================================

    // From http://www.quirksmode.org/js/events_properties.html#position
    // Get the mouse position.
    const getMousePos = (e) => {
        let posx = 0;
        let posy = 0;
        if (!e) e = window.event;
        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        }
        else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        return { x : posx, y : posy }
    };

    // Gets a random integer.
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Equation of a line (y = mx + b).
    const lineEq = (y2, y1, x2, x1, currentVal) => {
        const m = (y2 - y1) / (x2 - x1);
        const b = y1 - m * x1;
        return m * currentVal + b;
    };

    // ================================================
    // MOBILE DETECTION
    // Detect touch devices to disable tilt effects
    // ================================================
    const isTouchDevice = () => {
        return (('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (navigator.msMaxTouchPoints > 0));
    };

    // Some random chars.
    const chars = ['$','%','#','&','=','*','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','.',':',',','^'];
    const charsTotal = chars.length;
    
    // Randomize letters function. Used when navigating the slideshow to switch the current slide's texts.
    // PRESERVED: All timing values unchanged
    const randomizeLetters = (letters) => {
        return new Promise((resolve, reject) => {
            const lettersTotal = letters.length;
            let cnt = 0;

            letters.forEach((letter, pos) => { 
                let loopTimeout;
                const loop = () => {
                    letter.innerHTML = chars[getRandomInt(0,charsTotal-1)];
                    // PRESERVED: 50-500ms random interval
                    loopTimeout = setTimeout(loop, getRandomInt(50,500));
                };
                loop();

                const timeout = setTimeout(() => {
                    clearTimeout(loopTimeout);
                    letter.style.opacity = 1;
                    letter.innerHTML = letter.dataset.initial;
                    ++cnt;
                    if ( cnt === lettersTotal ) {
                        resolve();
                    }
                }, pos*lineEq(40,0,8,200,lettersTotal));
            });
        });
    };

    // Hide each of the letters with random delays. Used when showing the current slide's content.
    // PRESERVED: All timing values unchanged
    const disassembleLetters = (letters) => {
        return new Promise((resolve, reject) => {
            const lettersTotal = letters.length;
            let cnt = 0;
            
            letters.forEach((letter, pos) => {
                setTimeout(() => {
                    letter.style.opacity = 0;
                    ++cnt;
                    if ( cnt === lettersTotal ) {
                        resolve();
                    }
                }, pos*30); // PRESERVED: 30ms delay per letter
            });
        });
    }
    
    // The Slide class.
    class Slide {
        constructor(el) {
            this.DOM = {el: el};
            // The image wrap element.
            this.DOM.imgWrap = this.DOM.el.querySelector('.slide__img-wrap');
            // The image element.
            this.DOM.img = this.DOM.imgWrap.querySelector('.slide__img');
            // The texts: the parent wrap, title, number and side text.
            this.DOM.texts = {
                wrap: this.DOM.el.querySelector('.slide__title-wrap'),
                title: this.DOM.el.querySelector('.slide__title'),
                number: this.DOM.el.querySelector('.slide__number'),
                side: this.DOM.el.querySelector('.slide__side'),
            };

            // Split the title and side texts into spans, one per letter.
            charming(this.DOM.texts.title);
            if (this.DOM.texts.side) {
                charming(this.DOM.texts.side);
            }
            
            this.DOM.titleLetters = Array.from(this.DOM.texts.title.querySelectorAll('span')).sort(() => 0.5 - Math.random());
            this.DOM.sideLetters = this.DOM.texts.side ? Array.from(this.DOM.texts.side.querySelectorAll('span')).sort(() => 0.5 - Math.random()) : [];
            
            this.DOM.titleLetters.forEach(letter => letter.dataset.initial = letter.innerHTML);
            this.DOM.sideLetters.forEach(letter => letter.dataset.initial = letter.innerHTML);

            // Calculate the sizes of the image wrap. 
            this.calcSizes();
            // And also the transforms needed per position.
            this.calcTransforms();
            // Init/Bind events.
            this.initEvents();
        }

        // Gets the size of the image wrap.
        calcSizes() {
            this.width = this.DOM.imgWrap.offsetWidth;
            this.height = this.DOM.imgWrap.offsetHeight;
        }

        // Gets the transforms per slide position.
        // RESPONSIVE: Reduced rotation angles on mobile
        calcTransforms() {
            const isMobile = window.innerWidth < 768;
            
            if (isMobile) {
                // Simplified transforms for mobile (less dramatic angles)
                this.transforms = [
                    {x: -1*(winsize.width + this.width), y: -1*(winsize.height/2), rotation: -15},
                    {x: -1*(winsize.width/2), y: -1*(winsize.height/4), rotation: 0},
                    {x: 0, y: 0, rotation: 0},
                    {x: winsize.width/2, y: winsize.height/4, rotation: 0},
                    {x: winsize.width + this.width, y: winsize.height/2, rotation: 15},
                    {x: -1*(winsize.width/2 - this.width/2), y: 0, rotation: 0}
                ];
            } else {
                // Original transforms for desktop
                /*
                Each position corresponds to the position of a given slide:
                0: left top corner outside the viewport
                1: left top corner (prev slide position)
                2: center (current slide position)
                3: right bottom corner (next slide position)
                4: right bottom corner outside the viewport
                5: left side, for when the content is shown
                */
                this.transforms = [
                    {x: -1*(winsize.width/2+this.width), y: -1*(winsize.height/2+this.height), rotation: -30},
                    {x: -1*(winsize.width/2-this.width/3), y: -1*(winsize.height/2-this.height/3), rotation: 0},
                    {x: 0, y: 0, rotation: 0},
                    {x: winsize.width/2-this.width/3, y: winsize.height/2-this.height/3, rotation: 0},
                    {x: winsize.width/2+this.width, y: winsize.height/2+this.height, rotation: 30},
                    {x: -1*(winsize.width/2 - this.width/2 - winsize.width*0.075), y: 0, rotation: 0}
                ];
            }
        }

        // Init events:
        // Mouseevents for mousemove/tilt/scale on the current image, and window resize.
        initEvents() {
            // PRESERVED: 40ms timeout
            this.mouseenterFn = () => {
                if ( !this.isPositionedCenter() || !allowTilt ) return;
                clearTimeout(this.mousetime);
                this.mousetime = setTimeout(() => {
                    // Scale the image.
                    // PRESERVED: 0.8s Power3.easeOut, scale: 1.1
                    TweenMax.to(this.DOM.img, 0.8, {
                        ease: Power3.easeOut,
                        scale: 1.1
                    });
                }, 40);
            };

            this.mousemoveFn = ev => requestAnimationFrame(() => {
                // Tilt the current slide.
                if ( !allowTilt || !this.isPositionedCenter() ) return;
                this.tilt(ev);
            });

            this.mouseleaveFn = (ev) => requestAnimationFrame(() => {
                if ( !allowTilt || !this.isPositionedCenter() ) return;
                clearTimeout(this.mousetime);

                // Reset tilt and image scale.
                // PRESERVED: 1.8s Power4.easeOut
                TweenMax.to([this.DOM.imgWrap,this.DOM.texts.wrap], 1.8, {
                    ease: 'Power4.easeOut',
                    x: 0,
                    y: 0,
                    rotationX: 0,
                    rotationY: 0
                });
                TweenMax.to(this.DOM.img, 1.8, {
                    ease: 'Power4.easeOut',
                    scale: 1
                });
            });

            // When resizing the window recalculate size and transforms.
            this.resizeFn = () => {
                this.calcSizes();
                this.calcTransforms();
            };

            // PERFORMANCE: Hardware acceleration hints
            this.DOM.imgWrap.style.willChange = 'transform';
            this.DOM.texts.wrap.style.willChange = 'transform';

            // PERFORMANCE: Passive listeners for better scroll performance
            this.DOM.imgWrap.addEventListener('mouseenter', this.mouseenterFn);
            this.DOM.imgWrap.addEventListener('mousemove', this.mousemoveFn);
            this.DOM.imgWrap.addEventListener('mouseleave', this.mouseleaveFn);
            
            // Touch event with passive flag
            this.DOM.imgWrap.addEventListener('touchstart', () => {}, { passive: true });
            
            window.addEventListener('resize', this.resizeFn);
        }

        // Tilt the image wrap and texts when mouse moving the current slide.
        // PRESERVED: All ranges and timing unchanged
        tilt(ev) {
            const mousepos = getMousePos(ev);
            // Document scrolls.
            const docScrolls = {
                left : document.body.scrollLeft + document.documentElement.scrollLeft, 
                top : document.body.scrollTop + document.documentElement.scrollTop
            };
            const bounds = this.DOM.imgWrap.getBoundingClientRect();;
            // Mouse position relative to the main element (this.DOM.el).
            const relmousepos = { 
                x : mousepos.x - bounds.left - docScrolls.left, 
                y : mousepos.y - bounds.top - docScrolls.top 
            };
            
            // PRESERVED: -20 to 20px translation, -15 to 15deg rotation
            let t = {x:[-20,20],y:[-20,20]},
                r = {x:[-15,15],y:[-15,15]};

            const transforms = {
                translation : {
                    x: (t.x[1]-t.x[0])/bounds.width*relmousepos.x + t.x[0],
                    y: (t.y[1]-t.y[0])/bounds.height*relmousepos.y + t.y[0]
                },
                rotation : {
                    x: (r.x[1]-r.x[0])/bounds.height*relmousepos.y + r.x[0],
                    y: (r.y[1]-r.y[0])/bounds.width*relmousepos.x + r.y[0]
                }
            };

            // PRESERVED: 1.5s Power1.easeOut
            TweenMax.to(this.DOM.imgWrap, 1.5, {
                ease: 'Power1.easeOut',
                x: transforms.translation.x,
                y: transforms.translation.y,
                rotationX: transforms.rotation.x,
                rotationY: transforms.rotation.y
            }); 

            TweenMax.to(this.DOM.texts.wrap, 1.5, {
                ease: 'Power1.easeOut',
                x: -1*transforms.translation.x,
                y: -1*transforms.translation.y
            }); 
        }

        // Positions one slide (left, right or current) in the viewport.
        position(pos) {
            TweenMax.set(this.DOM.imgWrap, {
                x: this.transforms[pos].x, 
                y: this.transforms[pos].y, 
                rotationX: 0,
                rotationY: 0,
                opacity: 1,
                rotationZ: this.transforms[pos].rotation
            });
        }

        // Sets it as current.
        setCurrent(isContentOpen) {
            this.isCurrent = true;
            this.DOM.el.classList.add('slide--current', 'slide--visible');
            this.position(isContentOpen ? 5 : 2);
        }

        // Position the slide on the left side.
        setLeft(isContentOpen) {
            this.isRight = this.isCurrent = false;
            this.isLeft = true;
            this.DOM.el.classList.add('slide--visible');
            this.position(isContentOpen ? 0 : 1);
        }

        // Position the slide on the right side.
        setRight(isContentOpen) {
            this.isLeft = this.isCurrent = false;
            this.isRight = true;
            this.DOM.el.classList.add('slide--visible');
            this.position(isContentOpen ? 4 : 3);
        }

        // Check if the slide is positioned on the right side.
        isPositionedRight() {
            return this.isRight;
        }

        // Check if the slide is positioned on the left side.
        isPositionedLeft() {
            return this.isLeft;
        }

        // Check if the slide is the current one.
        isPositionedCenter() {
            return this.isCurrent;
        }

        // Reset classes and state.
        reset() {
            this.isRight = this.isLeft = this.isCurrent = false;
            this.DOM.el.classList = 'slide';
        }

        hide() {
            TweenMax.set(this.DOM.imgWrap, {x:0, y:0, rotationX:0, rotationY:0, rotationZ:0, opacity:0});
        }

        // Moves a slide to a specific position.
        // PRESERVED: 0.8s Power4.easeInOut
        moveToPosition(settings) {
            return new Promise((resolve, reject) => {
                TweenMax.to(this.DOM.imgWrap, .8, {
                    ease: Power4.easeInOut,
                    delay: settings.delay || 0,
                    startAt: settings.from !== undefined ? {
                        x: this.transforms[settings.from+2].x,
                        y: this.transforms[settings.from+2].y,
                        rotationX: 0,
                        rotationY: 0,
                        rotationZ: this.transforms[settings.from+2].rotation
                    } : {},
                    x: this.transforms[settings.position+2].x,
                    y: this.transforms[settings.position+2].y,
                    rotationX: 0,
                    rotationY: 0,
                    rotationZ: this.transforms[settings.position+2].rotation,
                    onStart: settings.from !== undefined ? () => TweenMax.set(this.DOM.imgWrap, {opacity: 1}) : null,
                    onComplete: resolve
                });
                
                // Reset image scale when showing the content.
                // PRESERVED: 0.8s Power4.easeInOut
                if ( settings.resetImageScale ) {
                    TweenMax.to(this.DOM.img, .8, {
                        ease: Power4.easeInOut,
                        scale: 1
                    });
                }
            });
        }

        // Hides the current slide's texts.
        hideTexts(animation = false) {
            if ( animation ) {
                disassembleLetters(this.DOM.titleLetters).then(() => TweenMax.set(this.DOM.texts.wrap, {opacity: 0}));
                if (this.DOM.sideLetters.length) {
                    disassembleLetters(this.DOM.sideLetters).then(() => TweenMax.set(this.DOM.texts.side, {opacity: 0}));
                }
            }
            else {
                TweenMax.set(this.DOM.texts.wrap, {opacity: 0});
                if (this.DOM.texts.side) {
                    TweenMax.set(this.DOM.texts.side, {opacity: 0});
                }
            }
        }

        // Shows the current slide's texts.
        showTexts(animation = true) {
            TweenMax.set(this.DOM.texts.wrap, {opacity: 1});
            if (this.DOM.texts.side) {
                TweenMax.set(this.DOM.texts.side, {opacity: 1});
            }

            if ( animation ) { 
                randomizeLetters(this.DOM.titleLetters);
                if (this.DOM.sideLetters.length) {
                    randomizeLetters(this.DOM.sideLetters);
                }
                // PRESERVED: 0.6s Elastic.easeOut.config(1,0.5)
                TweenMax.to(this.DOM.texts.number, 0.6, {
                    ease: Elastic.easeOut.config(1,0.5),
                    startAt: {x: '-10%', opacity: 0},
                    x: '0%',
                    opacity: 1 
                });
            }
        }
    }

    // The Content class.
    class Content {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.number = this.DOM.el.querySelector('.content__number');
            this.DOM.title = this.DOM.el.querySelector('.content__title');
            this.DOM.subtitle = this.DOM.el.querySelector('.content__subtitle');
            this.DOM.text = this.DOM.el.querySelector('.content__text');
            this.DOM.backCtrl = this.DOM.el.querySelector('.content__close');
            this.DOM.backCtrl.addEventListener('click', () => slideshow.hideContent());
        }

        show() {
            this.DOM.el.classList.add('content__item--current');

            // PRESERVED: 0.8s Power4.easeOut, delay 0.4s, stagger 0.05s
            TweenMax.staggerTo([this.DOM.backCtrl,this.DOM.number,this.DOM.title,this.DOM.subtitle,this.DOM.text], 0.8, {
                ease: Power4.easeOut,
                delay: 0.4,
                opacity: 1,
                startAt: {y: 40},
                y: 0
            }, 0.05);
        }

        hide() {
            this.DOM.el.classList.remove('content__item--current');

            // PRESERVED: 0.3s Power3.easeIn, stagger 0.01s
            TweenMax.staggerTo([this.DOM.backCtrl,this.DOM.number,this.DOM.title,this.DOM.subtitle,this.DOM.text].reverse(), 0.3, {
                ease: Power3.easeIn,
                opacity: 0,
                y: 10
            }, 0.01);
        }
    }

    // The Slideshow class.
    class Slideshow {
        constructor(el) {
            this.DOM = {el: el};
            // The slides.
            this.slides = [];
            Array.from(this.DOM.el.querySelectorAll('.slide')).forEach(slideEl => this.slides.push(new Slide(slideEl)));
            // The total number of slides.
            this.slidesTotal = this.slides.length;
            // At least 4 slides to continue...
            if ( this.slidesTotal < 4 ) {
                return false;
            }
            // Current slide position.
            this.current = 0;
            this.DOM.deco = this.DOM.el.querySelector('.slideshow__deco');

            this.contents = [];
            Array.from(document.querySelectorAll('.content > .content__item')).forEach(contentEl => this.contents.push(new Content(contentEl)));

            // Set the current/next/previous slides. 
            this.render();
            this.currentSlide.showTexts(false);
            // Init/Bind events.
            this.initEvents();
        }

        render() {
            // The current, next, and previous slides.
            this.currentSlide = this.slides[this.current];
            this.nextSlide = this.slides[this.current+1 <= this.slidesTotal-1 ? this.current+1 : 0];
            this.prevSlide = this.slides[this.current-1 >= 0 ? this.current-1 : this.slidesTotal-1];
            this.currentSlide.setCurrent();
            this.nextSlide.setRight();
            this.prevSlide.setLeft();
        }

        initEvents() {
            // Clicking the next and previous slide starts navigation / clicking current shows content.
            this.clickFn = (slide) => {
                if ( slide.isPositionedRight() ) {
                    this.navigate('next');
                }
                else if ( slide.isPositionedLeft() ) {
                    this.navigate('prev');
                }
                else {
                    this.showContent();
                }
            };

            for (let slide of this.slides) {
                slide.DOM.imgWrap.addEventListener('click', () => this.clickFn(slide));
            }

            this.resizeFn = () => {
                // Reposition the slides.
                this.nextSlide.setRight(this.isContentOpen);
                this.prevSlide.setLeft(this.isContentOpen);
                this.currentSlide.setCurrent(this.isContentOpen);

                if ( this.isContentOpen ) {
                    TweenMax.set(this.DOM.deco, {
                        scaleX: winsize.width/this.DOM.deco.offsetWidth,
                        scaleY: winsize.height/this.DOM.deco.offsetHeight,
                        x: -20,
                        y: 20
                    });
                }
            };
            window.addEventListener('resize', this.resizeFn);
        }

        showContent() {
            if ( this.isContentOpen || this.isAnimating ) return;
            allowTilt = false;
            this.isContentOpen = true;
            this.DOM.el.classList.add('slideshow--previewopen');

            // PRESERVED: 0.8s Power4.easeInOut
            TweenMax.to(this.DOM.deco, .8, {
                ease: Power4.easeInOut,
                scaleX: winsize.width/this.DOM.deco.offsetWidth,
                scaleY: winsize.height/this.DOM.deco.offsetHeight,
                x: -20,
                y: 20
            });

            // Move away right/left slides.
            this.prevSlide.moveToPosition({position: -2});
            this.nextSlide.moveToPosition({position: 2});
            // Position current slide and reset image scale.
            this.currentSlide.moveToPosition({position: 3, resetImageScale: true});
            // Show content.
            this.contents[this.current].show();
            // Hide texts.
            this.currentSlide.hideTexts(true);
        }

        hideContent() {
            if ( !this.isContentOpen || this.isAnimating ) return;

            this.DOM.el.classList.remove('slideshow--previewopen');

            // Hide content.
            this.contents[this.current].hide();

            // PRESERVED: 0.8s Power4.easeInOut
            TweenMax.to(this.DOM.deco, .8, {
                ease: Power4.easeInOut,
                scaleX: 1,
                scaleY: 1,
                x: 0,
                y: 0
            });

            // Move in right/left slides.
            this.prevSlide.moveToPosition({position: -1});
            this.nextSlide.moveToPosition({position: 1});
            // Position current slide.
            this.currentSlide.moveToPosition({position: 0}).then(() => {
                allowTilt = !isTouchDevice(); // Re-enable tilt only on non-touch devices
                this.isContentOpen = false;
            });
            // Show texts.
            this.currentSlide.showTexts();
        }

        // Animates the element behind the current slide.
        // PRESERVED: All timing values
        bounceDeco(direction, delay) {
            TweenMax.to(this.DOM.deco, .4, {
                ease: 'Power2.easeIn',
                delay: delay+delay*0.2,
                x: direction === 'next' ? -40 : 40,
                y: direction === 'next' ? -40 : 40,
                onComplete: () => {
                    TweenMax.to(this.DOM.deco, 0.6, {
                        ease: 'Power2.easeOut',
                        x: 0,
                        y: 0
                    });
                }
            });
        }

        // Navigate the slideshow.
        // PRESERVED: All delays (0, 0.07, 0.14, 0.21)
        navigate(direction) {
            // If animating return.
            if ( this.isAnimating ) return;
            this.isAnimating = true;
            allowTilt = false;

            const upcomingPos = direction === 'next' ? 
                    this.current < this.slidesTotal-2 ? this.current+2 : Math.abs(this.slidesTotal-2-this.current):
                    this.current >= 2 ? this.current-2 : Math.abs(this.slidesTotal-2+this.current);
            
            this.upcomingSlide = this.slides[upcomingPos];

            // Update current.
            this.current = direction === 'next' ? 
                    this.current < this.slidesTotal-1 ? this.current+1 : 0 :
                    this.current > 0 ? this.current-1 : this.slidesTotal-1;
            
            // Move slides with PRESERVED delays
            this.prevSlide.moveToPosition({position: direction === 'next' ? -2 : 0, delay: direction === 'next' ? 0 : 0.14}).then(() => {
                if ( direction === 'next' ) {
                    this.prevSlide.hide();
                }
            });
            
            this.currentSlide.moveToPosition({position: direction === 'next' ? -1 : 1, delay: 0.07 });
            this.currentSlide.hideTexts();
            
            this.bounceDeco(direction, 0.07);
            
            this.nextSlide.moveToPosition({position: direction === 'next' ? 0 : 2, delay: direction === 'next' ? 0.14 : 0 }).then(() => {
                if ( direction === 'prev' ) {
                    this.nextSlide.hide();
                }
            });

            if ( direction === 'next' ) {
                this.nextSlide.showTexts();
            }
            else {
                this.prevSlide.showTexts();
            }
            
            this.upcomingSlide.moveToPosition({position: direction === 'next' ? 1 : -1, from: direction === 'next' ? 2 : -2, delay: 0.21 }).then(() => {
                // Reset classes.
                [this.nextSlide,this.currentSlide,this.prevSlide].forEach(slide => slide.reset());
                this.render();
                allowTilt = !isTouchDevice(); // Re-enable tilt only on non-touch devices
                this.isAnimating = false;
            });
        }
    }

    // Window sizes.
    let winsize;
    const calcWinsize = () => winsize = {width: window.innerWidth, height: window.innerHeight};
    calcWinsize();
    
    // Debounced resize for better performance
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            calcWinsize();
        }, 100);
    });

    // MOBILE OPTIMIZATION: Disable tilt on touch devices
    let allowTilt = !isTouchDevice();

    // Init slideshow.
    const slideshow = new Slideshow(document.querySelector('.slideshow'));
    
    // Preload all images in the page.
    const loader = document.querySelector('.loader');
    imagesLoaded(document.querySelectorAll('.slide__img'), {background: true}, () => document.body.classList.remove('loading'));
}
