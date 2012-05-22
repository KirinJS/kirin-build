#import "Request.h"
@protocol MyScreen <NSObject>
 
/**
 * @param x
 * @param y
 * @param z
 */
- (void) do: (int) x times: (int) y plus: (int) z;
 
/**
 * @param reqest
 */
- (void) displayRequest: (id<Request>) reqest;
@end