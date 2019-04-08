import { Observable, of } from 'rxjs';
import { catchError, filter, map, mergeMap, take, tap } from 'rxjs/operators';
import { Attributes, HookSet } from './types';

export function lazyLoadImage<E>(hookSet: HookSet<E>, attributes: Attributes) {
  return (scrollObservable: Observable<E>) => {
    return scrollObservable.pipe(
      mergeMap(event => {
        const isVisible = hookSet.isVisible({
          element: attributes.element,
          event: event,
          offset: attributes.offset,
          scrollContainer: attributes.scrollContainer
        });
        return hookSet.loadImage(isVisible ? attributes : {...attributes, imagePath: undefined});
      }),
      tap(imagePath =>
        hookSet.setLoadedImage({
          element: attributes.element,
          imagePath,
          useSrcset: attributes.useSrcset
        })
      ),
      map(() => true),
      catchError(() => {
        hookSet.setErrorImage(attributes);
        return of(false);
      }),
      tap(() => hookSet.finally(attributes))
    );
  };
}
