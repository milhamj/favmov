import { routes, safeReturnTo, safeImageUrl } from '../navigation/routes';
test('encodes a single complete editor destination', () => {
 const destination = '/collection/add?movie_id=7&is_tv_show=true';
 expect(routes.loginWithReturnTo(destination)).toBe('/login?return_to=' + encodeURIComponent(destination));
 expect(safeReturnTo(destination)).toBe(destination);
});
test.each(['https://evil.test', '//evil.test', '/login', '/login?return_to=/collection', '/unknown', '/collection/../login'])('rejects invalid return destination %s', path => {
 expect(safeReturnTo(path)).toBe('/');
});

test('image route encodes the url', () => {
 expect(routes.image('https://image.tmdb.org/t/p/w500/a.jpg')).toBe('/image?url=https%3A%2F%2Fimage.tmdb.org%2Ft%2Fp%2Fw500%2Fa.jpg');
});
test.each(['https://image.tmdb.org/t/p/w500/a.jpg', 'https://gdlqv951tx.ufs.sh/f/abc'])('accepts app image %s', url => {
 expect(safeImageUrl(url)).toBe(url);
});
test.each(['http://image.tmdb.org/a.jpg', 'https://evil.test/a.jpg', 'https://image.tmdb.org.evil.test/a.jpg', 'https://image.tmdb.org@evil.test/a.jpg', 'javascript:alert(1)', '', undefined, ['https://image.tmdb.org/a.jpg']])('rejects image url %s', url => {
 expect(safeImageUrl(url)).toBeNull();
});
