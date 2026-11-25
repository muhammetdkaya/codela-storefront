<?php
define( 'ABSPATH', __DIR__ );
function add_filter( ...$args ) {}
require __DIR__ . '/../theme/codela-storefront/inc/agency-streaming.php';
function stream_check( $condition, $message ) { if ( ! $condition ) { throw new RuntimeException( $message ); } }
$base = [ 'REQUEST_METHOD' => 'GET', 'HTTP_SEC_FETCH_MODE' => 'navigate', 'HTTP_SEC_FETCH_SITE' => 'none' ];
stream_check( codela_sf_streaming_request_allowed( $base, [], [] ), 'Direct visitor eligible' );
foreach ( [ [ 'REQUEST_METHOD' => 'POST' ], [ 'HTTP_AUTHORIZATION' => 'x' ], [ 'HTTP_RANGE' => 'bytes=0-9' ], [ 'HTTP_COOKIE' => 'x=y' ], [ 'HTTP_SEC_FETCH_SITE' => 'same-origin' ], [ 'HTTP_SEC_FETCH_MODE' => 'cors' ], [ 'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest' ] ] as $patch ) {
    stream_check( ! codela_sf_streaming_request_allowed( array_replace( $base, $patch ), [], [] ), 'Unsafe request excluded' );
}
stream_check( ! codela_sf_streaming_request_allowed( $base, [ 'session' => 'x' ], [] ), 'Cookie excluded' );
stream_check( ! codela_sf_streaming_request_allowed( $base, [], [ 'pay' => '1' ] ), 'Query excluded' );
stream_check( codela_sf_streaming_headers_allowed( [ 'Content-Type: text/html' ] ), 'Native header safe' );
foreach ( [ 'Set-Cookie: x=y', 'Location: /', 'Content-Length: 20', 'Content-Encoding: gzip', 'Content-Disposition: attachment', 'Transfer-Encoding: chunked' ] as $header ) {
    stream_check( ! codela_sf_streaming_headers_allowed( [ $header ] ), 'Unsafe header excluded' );
}
$buffer = [ 'name' => 'default output handler', 'buffer_used' => 0, 'flags' => PHP_OUTPUT_HANDLER_FLUSHABLE ];
stream_check( codela_sf_streaming_buffer_allowed( [] ), 'No buffer eligible' );
stream_check( codela_sf_streaming_buffer_allowed( [ $buffer ] ), 'Empty default buffer eligible' );
stream_check( ! codela_sf_streaming_buffer_allowed( [ $buffer, $buffer ] ), 'Nested buffers excluded' );
stream_check( ! codela_sf_streaming_buffer_allowed( [ array_replace( $buffer, [ 'name' => 'cache_handler' ] ) ] ), 'Custom buffer excluded' );
stream_check( ! codela_sf_streaming_buffer_allowed( [ array_replace( $buffer, [ 'buffer_used' => 1 ] ) ] ), 'Nonempty buffer excluded' );
stream_check( ! codela_sf_streaming_buffer_allowed( [ array_replace( $buffer, [ 'flags' => 0 ] ) ] ), 'Nonflushable buffer excluded' );
$canvas = file_get_contents( __DIR__ . '/../theme/codela-storefront/inc/agency-streaming-canvas.php' );
stream_check( strpos( $canvas, 'flush();' ) < strpos( $canvas, '$template_html = get_the_block_template_html();' ), 'Flush before render' );
stream_check( strpos( $canvas, '$template_html = get_the_block_template_html();' ) < strpos( $canvas, "\nwp_head();" ), 'Native asset order' );
stream_check( ! str_contains( $canvas, 'ob_end_flush' ), 'Never destroy buffer' );
echo "Agency early streaming safety contracts passed.\n";
