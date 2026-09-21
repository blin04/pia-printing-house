import express from 'express'
import bcrypt from 'bcryptjs'
import UserModel from '../models/user'

const PASSWORD_REGEX = /^(?=.{8,12}$)(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z].*$/
const MATICNI_BROJ_REGEX = /^\d{8}$/
const PIB_REGEX = /^[1-9]\d{8}$/

export class UserController {
  // POST /users/register
  register = async (req: express.Request, res: express.Response) => {
    try {
      const { username, password, ime, prezime, telefon, email, tip, lice, institucija } = req.body

      if (!username || !password || !ime || !prezime || !telefon || !email || !tip)
        return res.status(400).json({ message: 'Missing required fields' })

      if (tip !== 'klijent' && tip !== 'stampar')
        return res.status(400).json({ message: 'Invalid user type' })

      if (tip === 'klijent' && lice !== 'fizicko' && lice !== 'pravno')
        return res.status(400).json({ message: 'Client must be fizicko or pravno lice' })

      if (!PASSWORD_REGEX.test(password))
        return res.status(400).json({
          message:
            'Password must be 8–12 chars, start with a letter, and contain an uppercase letter, a digit and a special character',
        })

      if (await UserModel.findOne({ username }))
        return res.status(400).json({ message: 'Username already taken' })
      if (await UserModel.findOne({ email: email.toLowerCase() }))
        return res.status(400).json({ message: 'Email already registered' })

      const needsInstitution = tip === 'stampar' || (tip === 'klijent' && lice === 'pravno')
      if (needsInstitution) {
        if (
          !institucija ||
          !institucija.naziv ||
          !institucija.adresaSedista ||
          !institucija.grad ||
          !institucija.maticniBroj ||
          !institucija.pib
        )
          return res.status(400).json({ message: 'Missing institution data' })

        if (!MATICNI_BROJ_REGEX.test(institucija.maticniBroj))
          return res.status(400).json({ message: 'maticniBroj must be exactly 8 digits' })
        if (!PIB_REGEX.test(institucija.pib))
          return res.status(400).json({ message: 'pib must be 9 digits and must not start with 0' })

        if (await UserModel.findOne({ 'institucija.maticniBroj': institucija.maticniBroj }))
          return res.status(400).json({ message: 'maticniBroj already registered' })
        if (await UserModel.findOne({ 'institucija.pib': institucija.pib }))
          return res.status(400).json({ message: 'pib already registered' })
      }

      const status = tip === 'klijent' && lice === 'fizicko' ? 'odobren' : 'neodobren'

      const passwordHash = bcrypt.hashSync(password, 10)

      const created = await UserModel.create({
        username,
        passwordHash,
        ime,
        prezime,
        telefon,
        email: email.toLowerCase(),
        tip,
        lice: tip === 'stampar' ? 'pravno' : lice, // printers are always legal persons
        status,
        institucija: needsInstitution
          ? {
              naziv: institucija.naziv,
              adresaSedista: institucija.adresaSedista,
              grad: institucija.grad,
              maticniBroj: institucija.maticniBroj,
              pib: institucija.pib,
              lokacija: institucija.lokacija,
            }
          : undefined,
        // profilna image upload is a later step; the schema default applies for now.
      })

      const obj: any = created.toObject()
      delete obj.passwordHash
      return res.status(201).json(obj)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /users/login
  login = async (req: express.Request, res: express.Response) => {
    try {
      const { username, password } = req.body
      if (!username || !password)
        return res.status(400).json({ message: 'Missing credentials' })

      const user = await UserModel.findOne({ username })
      if (!user || !bcrypt.compareSync(password, user.passwordHash))
        return res.status(401).json({ message: 'Invalid username or password' })

      // Registered but not yet approved by an admin.
      if (user.status !== 'odobren')
        return res.status(403).json({ message: 'Account is pending approval' })

      const obj: any = user.toObject()
      delete obj.passwordHash
      return res.json(obj)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }
}
