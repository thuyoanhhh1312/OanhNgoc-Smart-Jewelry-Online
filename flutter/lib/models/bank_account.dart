class BankAccount {
  final int id;
  final String bankName;
  final String? bankCode;
  final String accountNumber;
  final String? accountName;
  final String? type;
  final bool isEnabled;
  final String? description;

  BankAccount({
    required this.id,
    required this.bankName,
    required this.accountNumber,
    this.bankCode,
    this.accountName,
    this.type,
    this.isEnabled = true,
    this.description,
  });

  factory BankAccount.fromJson(Map<String, dynamic> json) {
    return BankAccount(
      id: json['id'] is int ? json['id'] as int : int.tryParse('${json['id']}') ?? 0,
      bankName: json['bank_name'] ?? '',
      bankCode: json['bank_code'],
      accountNumber: json['account_number'] ?? '',
      accountName: json['account_name'],
      type: json['type'],
      isEnabled: json['is_enabled'] ?? true,
      description: json['description'],
    );
  }
}
