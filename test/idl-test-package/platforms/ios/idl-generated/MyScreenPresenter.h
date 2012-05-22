@protocol MyScreenPresenter <NSObject>
 
/**
 * @param key
 * @param value
 */
- (void) onOkButtonTappedWithKey: (NSString*) key andValue: (NSString*) value;
@end