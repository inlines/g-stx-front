import { Directive, ElementRef, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";

enum Direction {
    UP = "up",
    DOWN = "down",
    NONE = "none"
}

@Directive({
    selector: "[trapScroll]",
    inputs: [ "trapScroll", "trapKeyScroll" ]
})
export class TrapScrollDirective implements OnInit, OnChanges, OnDestroy {

    public trapScroll!: boolean | string;
    public trapKeyScroll!: boolean | string;

    private element: HTMLElement;
    private zone: NgZone;
    private touchStartY: number = 0;

    constructor(elementRef: ElementRef, zone: NgZone) {
        this.element = elementRef.nativeElement;
        this.zone = zone;
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.trapScroll = this.normalizeInputAsBoolean(this.trapScroll);
        this.trapKeyScroll = this.normalizeInputAsBoolean(this.trapKeyScroll);

        if ("trapKeyScroll" in changes) {
            if (this.trapKeyScroll) {
                this.element.tabIndex = -1;
            } else {
                this.element.removeAttribute("tabIndex");
            }
        }
    }

    ngOnDestroy(): void {
        this.element.removeEventListener("wheel", this.handleEvent, false);
        this.element.removeEventListener("keydown", this.handleEvent, false);
        this.element.removeEventListener("touchstart", this.handleTouchStart, false);
        this.element.removeEventListener("touchmove", this.handleTouchMove, false);
    }

    ngOnInit(): void {
        this.zone.runOutsideAngular(() => {
            this.element.addEventListener("wheel", this.handleEvent, false);
            this.element.addEventListener("keydown", this.handleEvent, false);
            this.element.addEventListener("touchstart", this.handleTouchStart, false);
            this.element.addEventListener("touchmove", this.handleTouchMove, { passive: false });
        });
    }

    private handleTouchStart = (event: TouchEvent): void => {
        if (!this.trapScroll) return;
        this.touchStartY = event.touches[0].clientY;
    };

    private handleTouchMove = (event: TouchEvent): void => {
        if (!this.trapScroll) return;

        const touchY = event.touches[0].clientY;
        const deltaY = touchY - this.touchStartY;

        if (Math.abs(deltaY) < 5) return;

        const direction = deltaY > 0 ? Direction.UP : Direction.DOWN;
        const target = event.target as HTMLElement;

        if (this.shouldPreventTouchScroll(target, direction)) {
            event.preventDefault();
        }

        this.touchStartY = touchY;
    };

    private shouldPreventTouchScroll(target: HTMLElement, direction: Direction): boolean {
        while (target !== this.element) {
            if (this.isScrollableElement(target)) {
                const canScroll = !this.isScrolledInMaxDirection(target, direction);
                if (canScroll) return false;
            }
            target = target.parentElement as HTMLElement;
        }
        return this.isScrolledInMaxDirection(target, direction);
    }

    private handleEvent = (event: WheelEvent | KeyboardEvent): void => {
        if (!this.isTrappingEvent(event)) return;

        event.stopPropagation();

        if (this.eventShouldBePrevented(event)) {
            event.preventDefault();
        }
    };

    private eventShouldBePrevented(event: WheelEvent | KeyboardEvent): boolean {
        let target = event.target as HTMLElement;
        const direction = this.getDirectionFromEvent(event);

        while (target !== this.element) {
            if (this.isScrollableElement(target) && !this.isScrolledInMaxDirection(target, direction)) {
                return false;
            }
            target = target.parentElement as HTMLElement;
        }

        return this.isScrolledInMaxDirection(target, direction);
    }

    private getDirectionFromEvent(event: WheelEvent | KeyboardEvent): Direction {
        if (event instanceof WheelEvent) {
            return this.getDirectionFromWheelEvent(event);
        } else {
            return this.getDirectionFromKeyboardEvent(event);
        }
    }

    private getDirectionFromKeyboardEvent(event: KeyboardEvent): Direction {
        switch (event.key) {
            case " ":
                return event.shiftKey ? Direction.UP : Direction.DOWN;
            case "ArrowUp":
            case "Home":
            case "PageUp":
                return Direction.UP;
            case "ArrowDown":
            case "End":
            case "PageDown":
                return Direction.DOWN;
            default:
                return Direction.NONE;
        }
    }

    private getDirectionFromWheelEvent(event: WheelEvent): Direction {
        const delta = (event.deltaY || event.detail);
        return (delta <= 0) ? Direction.UP : Direction.DOWN;
    }

    private isFormElement(element: HTMLElement): boolean {
        return ["TEXTAREA", "INPUT", "SELECT"].includes(element.tagName);
    }

    private isScrollableElement(element: HTMLElement): boolean {
        if (getComputedStyle(element).overflowY === "hidden") {
            return false;
        }
        return element.scrollHeight !== element.clientHeight;
    }

    private isScrolledInMaxDirection(element: HTMLElement, direction: Direction): boolean {
        return (
            (direction === Direction.UP && this.isScrolledToTheTop(element)) ||
            (direction === Direction.DOWN && this.isScrolledToTheBottom(element))
        );
    }

    private isScrolledToTheBottom(element: HTMLElement): boolean {
        return (element.clientHeight + element.scrollTop) >= element.scrollHeight;
    }

    private isScrolledToTheTop(element: HTMLElement): boolean {
        return !element.scrollTop;
    }

    private isTrappingEvent(event: WheelEvent | KeyboardEvent): boolean {
        if (!this.trapScroll) return false;

        if (event instanceof KeyboardEvent) {
            if (!this.trapKeyScroll) return false;

            const target = event.target as HTMLElement;
            if (this.isFormElement(target)) return false;

            return this.getDirectionFromKeyboardEvent(event) !== Direction.NONE;
        }

        return true;
    }

    private normalizeInputAsBoolean(value: any): boolean {
        return (value === "") || !!value;
    }
}