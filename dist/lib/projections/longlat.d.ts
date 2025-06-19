export function init(): void;
export const names: string[];
declare namespace _default {
    export { init };
    export { identity as forward };
    export { identity as inverse };
    export { names };
}
export default _default;
declare function identity(pt: any): any;
export { identity as forward, identity as inverse };
