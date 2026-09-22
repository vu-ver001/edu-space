// Báo cho TypeScript biết rằng mọi lệnh import file .css đều hợp lệ
declare module '*.css' {
    const classes: { [key: string]: string };
    export default classes;
}

declare module '*.scss';
declare module '*.sass';