declare module 'fontmin' {
	class Fontmin {
		constructor();
		src(file: any):any
		use(plugin: any):any
		dest(folder:string):any
		static glyph(obj:any):any
		static ttf2woff(obj:any):any
	}
	export = Fontmin
}
