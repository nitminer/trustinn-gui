// samples.js - Embedded sample code database
const SAMPLES = {
  java: [
    {
      id: 'armstrong',
      name: 'Armstrong Number',
      description: 'Check if a number is an Armstrong number',
      code: `import java.util.Scanner;

public class ArmstrongNumber {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter a number: ");
        int number = scanner.nextInt();
        int originalNumber = number;
        int result = 0;
        int digits = String.valueOf(number).length();

        while (number != 0) {
            int remainder = number % 10;
            result += Math.pow(remainder, digits);
            number /= 10;
        }

        if (result == originalNumber) {
            System.out.println(originalNumber + " is an Armstrong number.");
        } else {
            System.out.println(originalNumber + " is not an Armstrong number.");
        }
    }
}`
    },
    {
      id: 'fibonacci',
      name: 'Fibonacci Series',
      description: 'Generate Fibonacci series up to n terms',
      code: `public class Fibonacci {
    public static void main(String[] args) {
        int n = 10;
        int a = 0, b = 1;
        
        System.out.println("Fibonacci Series:");
        for (int i = 0; i < n; i++) {
            System.out.print(a + " ");
            int temp = a + b;
            a = b;
            b = temp;
        }
    }
}`
    },
    {
      id: 'prime',
      name: 'Prime Number Checker',
      description: 'Check if a number is prime',
      code: `import java.util.Scanner;

public class PrimeNumber {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter a number: ");
        int number = scanner.nextInt();
        
        if (isPrime(number)) {
            System.out.println(number + " is a prime number.");
        } else {
            System.out.println(number + " is not a prime number.");
        }
    }
    
    static boolean isPrime(int n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 == 0 || n % 3 == 0) return false;
        
        for (int i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0) return false;
        }
        return true;
    }
}`
    }
  ],
  python: [
    {
      id: 'armstrong_py',
      name: 'Armstrong Number',
      description: 'Check if a number is an Armstrong number',
      code: `number = int(input("Enter a number: "))
original_number = number
result = 0
digits = len(str(number))

while number != 0:
    remainder = number % 10
    result += remainder ** digits
    number //= 10

if result == original_number:
    print(f"{original_number} is an Armstrong number.")
else:
    print(f"{original_number} is not an Armstrong number.")`
    },
    {
      id: 'fibonacci_py',
      name: 'Fibonacci Series',
      description: 'Generate Fibonacci series',
      code: `n = 10
a, b = 0, 1

print("Fibonacci Series:")
for _ in range(n):
    print(a, end=" ")
    a, b = b, a + b`
    }
  ],
  c: [
    {
      id: 'hello_c',
      name: 'Hello World',
      description: 'Classic Hello World program',
      code: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`
    },
    {
      id: 'palindrome_c',
      name: 'Palindrome Checker',
      description: 'Check if a string is palindrome',
      code: `#include <stdio.h>
#include <string.h>

int main() {
    char str[100];
    scanf("%s", str);
    
    int n = strlen(str);
    int flag = 1;
    
    for (int i = 0; i < n / 2; i++) {
        if (str[i] != str[n - 1 - i]) {
            flag = 0;
            break;
        }
    }
    
    if (flag)
        printf("%s is a palindrome\\n", str);
    else
        printf("%s is not a palindrome\\n", str);
    
    return 0;
}`
    }
  ],
  javascript: [
    {
      id: 'hello_js',
      name: 'Hello World',
      description: 'Console Hello World',
      code: `console.log("Hello, World!");`
    }
  ]
};

module.exports = SAMPLES;
