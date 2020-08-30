

export class MinHeap {

    public heap;
    public compare_function;

    //---------------
    constructor ( compare_function ) {
        /* Initialing the array heap and adding a dummy element at index 0 */
        this.heap = [null]
        
        if ( compare_function != null ) {
            this.compare_function = compare_function;
        } else {
            this.compare_function = function(a,b) {
                return a < b;
            }
        }
    }



    //---------------
    public getMin () {
        /* Accessing the min element at index 1 in the heap array */
        return this.heap[1]
    }
    

    //-------------
    public swap( a, b ) {

        var tmp = this.heap[a];
        this.heap[a] = this.heap[b];
        this.heap[b] = tmp;
    }

    //---------------
    public push(node) {

        /* Inserting the new node at the end of the heap array */
        this.heap.push(node)

        /* Finding the correct position for the new node */

        if (this.heap.length > 1) {
            let current = this.heap.length - 1

            /* Traversing up the parent node until the current node (current) is greater than the parent (current/2)*/
            while (current > 1 &&  this.compare_function( this.heap[current] , this.heap[Math.floor(current/2)] ) ) {

                /* Swapping the two nodes by using the ES6 destructuring syntax*/
                this.swap(  Math.floor(current/2)   ,  current  ) ;
                current = Math.floor(current/2);

            }
        }
    }
    

    //-----
    public length() {
        return this.heap.length - 1;
    }



    //---------------
    public pop(  ) {
        /* Smallest element is at the index 1 in the heap array */
        let smallest = this.heap[1]

        /* When there are more than two elements in the array, we put the right most element at the first position
            and start comparing nodes with the child nodes
        */
        if (this.heap.length > 2) {
            this.heap[1] = this.heap[this.heap.length-1]
            this.heap.splice(this.heap.length - 1)

            if (this.heap.length === 3) {
                if (  this.compare_function(  this.heap[2] , this.heap[1] )   ) {
                    this.swap( 1, 2 );
                }
                return smallest
            }

            let current = 1
            let leftChildIndex = current * 2
            let rightChildIndex = current * 2 + 1

                
            while (  this.heap[leftChildIndex] &&
                     this.heap[rightChildIndex] &&
                    ( !this.compare_function( this.heap[current] , this.heap[leftChildIndex] ) ||
                      !this.compare_function( this.heap[current] , this.heap[rightChildIndex] )    )) {



                if ( this.compare_function( this.heap[leftChildIndex] , this.heap[rightChildIndex] )  ) {

                    this.swap( current , leftChildIndex  ) ;
                    current = leftChildIndex
                
                } else {
                    
                    this.swap( current , rightChildIndex  ) ;
                    current = rightChildIndex
                }

                leftChildIndex = current * 2
                rightChildIndex = current * 2 + 1
            }
        }

        /* If there are only two elements in the array, we directly splice out the first element */

        else if (this.heap.length === 2) {
            this.heap.splice(1, 1)
        } else {
            return null
        }

        return smallest
    }
}
