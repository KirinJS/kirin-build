#import "Response.h"
@protocol Request <NSObject>
 
@property NSDictionary* headers;
 
/**
 * @param response
 */
- (void) respondWith: (id<Response>) response;
 
- (void) onError;
@end