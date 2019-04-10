import {Observable, of} from 'rxjs';
import {catchError, filter, map, mergeMap, take, tap} from 'rxjs/operators';
import {Attributes, HookSet} from './types';

export function lazyLoadImage<E>(hookSet: HookSet<E>, attributes: Attributes) {
  return (scrollObservable: Observable<E>) => {

    const pipeOperations = [];
    if (attributes.unload) {
      pipeOperations.push(mergeMap((event: E) => {
        const isVisible = hookSet.isVisible({
          element: attributes.element,
          event: event,
          offset: attributes.offset,
          scrollContainer: attributes.scrollContainer
        });
        return hookSet.loadImage(isVisible ? attributes : {...attributes, imagePath: undefined});
      }));
    } else {
      pipeOperations.push(
        filter((event: E) => hookSet.isVisible({
          element: attributes.element,
          event: event,
          offset: attributes.offset,
          scrollContainer: attributes.scrollContainer
        }))
      );
      pipeOperations.push(take(1));
      pipeOperations.push(mergeMap(() => hookSet.loadImage(attributes)))
    }

    const defaultPipeOperations = [
      tap((imagePath: string) =>
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
    ];

    return scrollObservable.pipe(...pipeOperations.concat(defaultPipeOperations)) as Observable<boolean>;
  };
}
